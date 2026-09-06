<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\EquipmentRental;
use App\Models\Consultation;
use App\Models\OrderItem;
use App\Models\EmergencyAlert;
use App\Models\Payment;
use App\Models\Pharmacist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class ActivityLedgerController extends Controller
{
    public function timeline(Request $request): JsonResponse
    {
        return $this->getTimelineResponse(Auth::id(), $request);
    }

    public function summary(): JsonResponse
    {
        return $this->getSummaryResponse(Auth::id());
    }

    public function patientTimeline(Request $request, string $userId): JsonResponse
    {
        $currentUser = Auth::user();

        // Admin/Super Admin can bypass check
        if ($currentUser->isSuperAdmin() || $currentUser->isAdmin()) {
            return $this->getTimelineResponse($userId, $request);
        }

        // Must be a pharmacist
        $pharmacist = Pharmacist::where('user_id', $currentUser->id)->first();
        if (!$pharmacist) {
            return response()->json(['errors' => 'Access denied. You must be an approved medical staff to view patient history.'], 403);
        }

        // Must have an existing consultation with the patient
        $hasConsultation = Consultation::where('user_id', $userId)
            ->whereHas('slot', function ($query) use ($pharmacist) {
                $query->where('pharmacist_id', $pharmacist->id);
            })
            ->exists();

        if (!$hasConsultation) {
            return response()->json(['errors' => 'Access denied. You can only view ledgers of patients who booked consultations with you.'], 403);
        }

        return $this->getTimelineResponse($userId, $request);
    }

    public function patientSummary(string $userId): JsonResponse
    {
        $currentUser = Auth::user();

        if ($currentUser->isSuperAdmin() || $currentUser->isAdmin()) {
            return $this->getSummaryResponse($userId);
        }

        $pharmacist = Pharmacist::where('user_id', $currentUser->id)->first();
        if (!$pharmacist) {
            return response()->json(['errors' => 'Access denied.'], 403);
        }

        $hasConsultation = Consultation::where('user_id', $userId)
            ->whereHas('slot', function ($query) use ($pharmacist) {
                $query->where('pharmacist_id', $pharmacist->id);
            })
            ->exists();

        if (!$hasConsultation) {
            return response()->json(['errors' => 'Access denied.'], 403);
        }

        return $this->getSummaryResponse($userId);
    }

    /**
     * Full detail for one timeline entry.
     *
     * The timeline only carries a summary line, so clicking an item used to
     * dump the caller on a full list page. This returns just the record that
     * was clicked, scoped to its owner so one patient cannot read another's.
     */
    public function entry(string $type, string $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $isStaff = $user->isAdmin() || $user->isSuperAdmin();

            $detail = match ($type) {
                // Both order categories resolve to the same order record; the
                // timeline type only decides how the row was labelled.
                'purchase', 'equipment_purchase' => Order::with([
                        'orderItems.medicine:id,name,price',
                        'orderItems.equipment:id,name,category',
                        'delivery',
                        'prescriptions',
                    ])->find($id),
                'equipment' => EquipmentRental::with(['equipment:id,name,category', 'vendor:id,company_name,contact_phone'])
                    ->find($id),
                'consultation' => Consultation::with(['slot.pharmacist.user:id,username,first_name,last_name'])
                    ->find($id),
                'emergency' => EmergencyAlert::with('assignedVehicle:id,vehicle_number')->find($id),
                'payment' => Payment::with('order:id,total_amount,order_status,payment_status')->find($id),
                default => null,
            };

            if (!$detail) {
                return response()->json(['errors' => 'Record not found.'], 404);
            }

            if (!$isStaff && (int) $detail->user_id !== (int) $user->id) {
                return response()->json(['errors' => 'You are not authorized to view this record.'], 403);
            }

            return response()->json(['type' => $type, 'data' => $detail], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    private function getTimelineResponse(string $userId, Request $request): JsonResponse
    {
        try {
            $typeFilter = $request->input('type', 'all');
            $fromDate = $request->input('from');
            $toDate = $request->input('to');

            $timeline = [];

            // 1. Orders, split by what was actually bought.
            //
            // One order can hold medicines and equipment at once, so a single
            // "Medicine Purchase" row would mislabel a wheelchair. Each
            // category present becomes its own entry carrying its own subtotal.
            //
            // Rental lines are deliberately skipped here: checkout already
            // writes an EquipmentRental row for them, which section 2 reads, so
            // emitting them again would duplicate every rental.
            if (in_array($typeFilter, ['all', 'purchase', 'equipment_purchase'])) {
                $orders = Order::with(['orderItems.medicine', 'orderItems.equipment'])
                    ->where('user_id', $userId)
                    ->when($fromDate, fn($q) => $q->whereDate('order_date', '>=', $fromDate))
                    ->when($toDate, fn($q) => $q->whereDate('order_date', '<=', $toDate))
                    ->get();

                $orderCategories = [
                    'purchase' => [
                        'item_type' => OrderItem::TYPE_MEDICINE,
                        'title' => 'Medicine Purchase',
                        'noun' => 'medicine',
                    ],
                    'equipment_purchase' => [
                        'item_type' => OrderItem::TYPE_EQUIPMENT_PURCHASE,
                        'title' => 'Equipment Purchase',
                        'noun' => 'equipment',
                    ],
                ];

                foreach ($orders as $order) {
                    $orderDate = $order->order_date
                        ? Carbon::parse($order->order_date)->toIso8601String()
                        : null;

                    foreach ($orderCategories as $entryType => $category) {
                        if (!in_array($typeFilter, ['all', $entryType])) {
                            continue;
                        }

                        $lines = $order->orderItems
                            ->where('item_type', $category['item_type']);

                        if ($lines->isEmpty()) {
                            continue;
                        }

                        $names = $lines->map(function ($item) {
                            $name = $item->medicine->name ?? $item->equipment->name ?? 'Item';

                            return $item->quantity . 'x ' . $name;
                        })->implode(', ');

                        // The category's own subtotal, not the order total, so
                        // the delivery charge is not counted under both rows.
                        // Rows placed before the mixed cart migration stored no
                        // line prices, hence the fallbacks.
                        $subtotal = $lines->sum(function ($item) {
                            if ($item->line_total !== null) {
                                return (float) $item->line_total;
                            }

                            if ($item->unit_price !== null) {
                                return (float) $item->unit_price * $item->quantity;
                            }

                            $price = $item->medicine->price ?? $item->equipment->sale_price ?? 0;

                            return (float) $price * $item->quantity;
                        });

                        // Nothing priced at all, and the order holds only this
                        // category, so its total is the one figure we can trust.
                        if ($subtotal <= 0 && $order->orderItems->count() === $lines->count()) {
                            $subtotal = (float) $order->total_amount;
                        }

                        $timeline[] = [
                            'id' => $order->id,
                            'type' => $entryType,
                            'date' => $orderDate,
                            'title' => $category['title'] . ': ' . $names,
                            'description' => 'Ordered ' . $lines->sum('quantity') . ' '
                                . $category['noun'] . ' item(s) in order #' . $order->id . '.',
                            'amount' => round($subtotal, 2),
                            'status' => $order->order_status,
                            'details' => [
                                'order_id' => $order->id,
                                'items' => $names,
                                'order_total' => $order->total_amount,
                                'prescription_required' => $order->prescription_required,
                                'subscription_renewal' => $order->is_subscription_renewal,
                            ]
                        ];
                    }
                }
            }

            // 2. Equipment Rentals
            if (in_array($typeFilter, ['all', 'equipment'])) {
                $rentals = EquipmentRental::with(['equipment', 'vendor'])
                    ->where('user_id', $userId)
                    ->when($fromDate, fn($q) => $q->whereDate('rental_start', '>=', $fromDate))
                    ->when($toDate, fn($q) => $q->whereDate('rental_start', '<=', $toDate))
                    ->get();

                foreach ($rentals as $rental) {
                    $timeline[] = [
                        'id' => $rental->id,
                        'type' => 'equipment',
                        'date' => $rental->rental_start ? Carbon::parse($rental->rental_start)->toIso8601String() : null,
                        'title' => 'Equipment Rental: ' . ($rental->equipment ? $rental->equipment->name : 'Medical Equipment'),
                        'description' => "Rented from " . ($rental->vendor ? $rental->vendor->company_name : 'Supplier') . " until " . ($rental->rental_end ? $rental->rental_end->format('Y-m-d') : 'N/A'),
                        'amount' => $rental->total_price,
                        'status' => $rental->status,
                        'details' => [
                            'equipment_name' => $rental->equipment ? $rental->equipment->name : 'N/A',
                            'rental_end' => $rental->rental_end ? $rental->rental_end->format('Y-m-d') : null,
                        ]
                    ];
                }
            }

            // 3. Online Doctor Visits (Consultations)
            if (in_array($typeFilter, ['all', 'consultation'])) {
                $consultations = Consultation::with(['slot.pharmacist.user'])
                    ->where('user_id', $userId)
                    ->when($fromDate, fn($q) => $q->join('slots', 'consultations.slot_id', '=', 'slots.id')->whereDate('slots.date', '>=', $fromDate))
                    ->when($toDate, fn($q) => $q->join('slots', 'consultations.slot_id', '=', 'slots.id')->whereDate('slots.date', '<=', $toDate))
                    ->select('consultations.*')
                    ->get();

                foreach ($consultations as $consultation) {
                    $pharmacistUser = $consultation->slot && $consultation->slot->pharmacist && $consultation->slot->pharmacist->user
                        ? $consultation->slot->pharmacist->user
                        : null;
                    $docName = $pharmacistUser ? "Dr. " . ($pharmacistUser->first_name ?: $pharmacistUser->username) : "Online Medical Staff";

                    $timeline[] = [
                        'id' => $consultation->id,
                        'type' => 'consultation',
                        'date' => $consultation->slot && $consultation->slot->date ? Carbon::parse($consultation->slot->date)->toIso8601String() : null,
                        'title' => 'Online Doctor Visit',
                        'description' => "Consultation session scheduled with {$docName}.",
                        'amount' => 0.00, // free / covered by subscription
                        'status' => $consultation->status,
                        'details' => [
                            'doctor_name' => $docName,
                            'time' => $consultation->slot ? "{$consultation->slot->start_time}:00 {$consultation->slot->start_period}" : 'N/A',
                        ]
                    ];
                }
            }

            // 4. Past Emergency Alerts
            if (in_array($typeFilter, ['all', 'emergency'])) {
                $alerts = EmergencyAlert::where('user_id', $userId)
                    ->when($fromDate, fn($q) => $q->whereDate('created_at', '>=', $fromDate))
                    ->when($toDate, fn($q) => $q->whereDate('created_at', '<=', $toDate))
                    ->get();

                foreach ($alerts as $alert) {
                    $timeline[] = [
                        'id' => $alert->id,
                        'type' => 'emergency',
                        'date' => $alert->created_at ? $alert->created_at->toIso8601String() : null,
                        'title' => '🚨 Emergency Alert Triggered',
                        'description' => "Emergency alert for " . str_replace('_', ' ', $alert->alert_type) . " dispatch to {$alert->location}.",
                        'amount' => 0.00,
                        'status' => $alert->status,
                        'details' => [
                            'alert_type' => $alert->alert_type,
                            'location' => $alert->location,
                            'notes' => $alert->notes,
                        ]
                    ];
                }
            }

            // 5. Payment Receipts
            if (in_array($typeFilter, ['all', 'payment'])) {
                $payments = Payment::with('order.orderItems.medicine')
                    ->where('user_id', $userId)
                    ->when($fromDate, fn($q) => $q->whereDate('payment_date', '>=', $fromDate))
                    ->when($toDate, fn($q) => $q->whereDate('payment_date', '<=', $toDate))
                    ->get();

                foreach ($payments as $payment) {
                    $timeline[] = [
                        'id' => $payment->id,
                        'type' => 'payment',
                        'date' => $payment->payment_date ? Carbon::parse($payment->payment_date)->toIso8601String() : null,
                        'title' => 'Payment Receipt for Order #' . $payment->order_id,
                        'description' => "Paid successfully via " . ucfirst($payment->payment_type) . ".",
                        'amount' => $payment->order ? $payment->order->total_amount : 0.00,
                        'status' => 'successful',
                        'details' => [
                            'order_id' => $payment->order_id,
                            'payment_type' => $payment->payment_type,
                        ]
                    ];
                }
            }

            // Sort timeline by date descending
            usort($timeline, function ($a, $b) {
                return strcmp($b['date'], $a['date']);
            });

            // Paginate manually
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);
            $offset = ($page - 1) * $perPage;

            $timelineCollection = collect($timeline);
            $itemsForPage = $timelineCollection->slice($offset, $perPage)->values();

            $paginator = new LengthAwarePaginator(
                $itemsForPage,
                $timelineCollection->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            // Structure paginator results to match laravel's pagination json structure
            return response()->json([
                'data' => $paginator->items(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'Failed to load timeline history.'], 500);
        }
    }

    private function getSummaryResponse(string $userId): JsonResponse
    {
        try {
            // Counted the same way the timeline splits them, so the tiles and
            // the tabs never disagree about what an order was.
            $totalPurchases = Order::where('user_id', $userId)
                ->whereHas('orderItems', fn ($q) => $q->where('item_type', OrderItem::TYPE_MEDICINE))
                ->count();

            $totalEquipmentPurchases = Order::where('user_id', $userId)
                ->whereHas('orderItems', fn ($q) => $q->where('item_type', OrderItem::TYPE_EQUIPMENT_PURCHASE))
                ->count();

            $totalRentals = EquipmentRental::where('user_id', $userId)->count();
            $totalConsultations = Consultation::where('user_id', $userId)->count();
            $totalAlerts = EmergencyAlert::where('user_id', $userId)->count();

            return response()->json([
                'total_purchases' => $totalPurchases,
                'total_equipment_purchases' => $totalEquipmentPurchases,
                'total_rentals' => $totalRentals,
                'total_consultations' => $totalConsultations,
                'total_alerts' => $totalAlerts,
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'Failed to load timeline summary.'], 500);
        }
    }
}
