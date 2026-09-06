<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\AmbulanceCompany;
use App\Models\EquipmentRental;
use App\Models\EquipmentFulfillment;
use App\Models\AmbulanceVehicle;
use App\Models\AmbulanceTrip;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Medicine;
use App\Models\User;
use App\Models\VendorReview;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PartnerDashboardController extends Controller
{
    /** At or below this many units, a medicine is flagged for reordering. */
    private const LOW_STOCK_THRESHOLD = 10;

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Build the last N calendar months as ordered buckets, so the frontend can
     * draw a trend without doing driver-specific date grouping in SQL.
     *
     * @return array<string, array{label: string, start: Carbon, end: Carbon, value: float, count: int}>
     */
    private function monthBuckets(int $months = 6): array
    {
        $buckets = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $start = now()->startOfMonth()->subMonths($i);
            $buckets[$start->format('Y-m')] = [
                'label' => $start->format('M Y'),
                'start' => $start->copy(),
                'end' => $start->copy()->endOfMonth(),
                'value' => 0.0,
                'count' => 0,
            ];
        }

        return $buckets;
    }

    /**
     * Drop the Carbon helpers before the buckets go over the wire.
     *
     * @param array<string, mixed> $buckets
     * @return array<int, array{label: string, value: float, count: int}>
     */
    private function serialiseBuckets(array $buckets): array
    {
        return array_values(array_map(fn ($bucket) => [
            'label' => $bucket['label'],
            'value' => round($bucket['value'], 2),
            'count' => $bucket['count'],
        ], $buckets));
    }

    /**
     * Turn raw name => amount pairs into shares of the whole, which is what the
     * percentage bars and donuts on the frontend render.
     *
     * @param array<string, float> $parts
     * @return array<int, array{label: string, value: float, percentage: float}>
     */
    private function toShares(array $parts): array
    {
        $total = array_sum($parts);

        $shares = [];
        foreach ($parts as $label => $value) {
            $shares[] = [
                'label' => $label,
                'value' => round($value, 2),
                'percentage' => $total > 0 ? round(($value / $total) * 100, 1) : 0.0,
            ];
        }

        return $shares;
    }

    public function vendorDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $vendor = null;

            // Admin / Super Admin can view any vendor dashboard
            if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('vendor_id')) {
                $vendor = Vendor::find($request->vendor_id);
            } else if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('user_id')) {
                $vendor = Vendor::where('user_id', $request->user_id)->first();
            } else {
                // Otherwise retrieve the vendor profile of the logged-in user
                $vendor = Vendor::where('user_id', $user->id)->first();
            }

            // Fallback for admin if no vendor selected
            if (!$vendor && ($user->isAdmin() || $user->isSuperAdmin())) {
                $vendor = Vendor::first();
            }

            if (!$vendor) {
                return response()->json(['errors' => 'Authorized vendor profile not found.'], 403);
            }

            // 1. Live asset usage
            $equipmentList = $vendor->equipment()->get();
            $assetUsage = $equipmentList->map(function ($item) {
                $rentedCount = EquipmentRental::where('equipment_id', $item->id)
                    ->where('status', 'active')
                    ->count();

                $totalUnits = $item->quantity + $rentedCount;

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category,
                    'total_quantity' => $totalUnits,
                    'rented_quantity' => $rentedCount,
                    'available_quantity' => $item->quantity,
                    'utilization' => $totalUnits > 0 ? round(($rentedCount / $totalUnits) * 100, 1) : 0.0,
                    'is_for_rent' => (bool) $item->is_for_rent,
                    'is_for_sale' => (bool) $item->is_for_sale,
                ];
            });

            // 2. Active rentals
            $activeRentals = EquipmentRental::with(['user', 'equipment'])
                ->where('vendor_id', $vendor->id)
                ->where('status', 'active')
                ->orderBy('rental_start', 'desc')
                ->get()
                ->map(function ($rental) {
                    return [
                        'id' => $rental->id,
                        'equipment_name' => $rental->equipment->name ?? 'Unknown',
                        'customer_name' => trim(($rental->user->first_name ?? '') . ' ' . ($rental->user->last_name ?? '')),
                        'customer_email' => $rental->user->email ?? 'N/A',
                        'rental_start' => $rental->rental_start,
                        'rental_end' => $rental->rental_end,
                        'total_price' => $rental->total_price,
                    ];
                });

            // 3. Upcoming income projections (sum of active/future rentals)
            $incomeProjections = EquipmentRental::where('vendor_id', $vendor->id)
                ->whereIn('status', ['active'])
                ->sum('total_price');

            // 4. Average review rating
            $avgRating = VendorReview::where('vendor_id', $vendor->id)->avg('rating') ?: 0.0;
            $reviewsCount = VendorReview::where('vendor_id', $vendor->id)->count();

            // 5. Revenue split between outright sales and rentals
            $fulfillments = EquipmentFulfillment::with('equipment:id,name,category')
                ->where('vendor_id', $vendor->id)
                ->where('status', '!=', EquipmentFulfillment::STATUS_CANCELLED)
                ->get();

            $saleRevenue = (float) $fulfillments
                ->where('type', EquipmentFulfillment::TYPE_PURCHASE)
                ->sum('total_price');
            $rentalRevenue = (float) $fulfillments
                ->where('type', EquipmentFulfillment::TYPE_RENTAL)
                ->sum('total_price');

            $revenueMix = $this->toShares([
                'Sales' => $saleRevenue,
                'Rentals' => $rentalRevenue,
            ]);

            // 6. Revenue per equipment category
            $categoryTotals = [];
            foreach ($fulfillments as $fulfillment) {
                $category = $fulfillment->equipment->category ?? 'Uncategorised';
                $categoryTotals[$category] = ($categoryTotals[$category] ?? 0) + (float) $fulfillment->total_price;
            }
            arsort($categoryTotals);
            $categoryMix = $this->toShares($categoryTotals);

            // 7. Six month revenue trend
            $buckets = $this->monthBuckets();
            foreach ($fulfillments as $fulfillment) {
                $key = Carbon::parse($fulfillment->created_at)->format('Y-m');
                if (isset($buckets[$key])) {
                    $buckets[$key]['value'] += (float) $fulfillment->total_price;
                    $buckets[$key]['count']++;
                }
            }

            // 8. Top earning equipment
            $equipmentTotals = [];
            foreach ($fulfillments as $fulfillment) {
                $name = $fulfillment->equipment->name ?? 'Unknown';
                $equipmentTotals[$name] = ($equipmentTotals[$name] ?? 0) + (float) $fulfillment->total_price;
            }
            arsort($equipmentTotals);
            $topEquipment = $this->toShares(array_slice($equipmentTotals, 0, 5, true));

            // 9. Handover requests still waiting on the vendor
            $pendingFulfillments = EquipmentFulfillment::with([
                    'equipment:id,name',
                    'user:id,username,first_name,last_name,email',
                ])
                ->where('vendor_id', $vendor->id)
                ->open()
                ->orderBy('created_at')
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'order_id' => $item->order_id,
                    'equipment_name' => $item->equipment->name ?? 'Unknown',
                    'customer_name' => trim(($item->user->first_name ?? '') . ' ' . ($item->user->last_name ?? ''))
                        ?: ($item->user->username ?? 'Customer'),
                    'customer_phone' => $item->customer_phone,
                    'type' => $item->type,
                    'quantity' => $item->quantity,
                    'rental_start' => $item->rental_start,
                    'rental_end' => $item->rental_end,
                    'total_price' => (float) $item->total_price,
                    'status' => $item->status,
                    'handover_address' => $item->handover_address,
                    'handover_scheduled_at' => $item->handover_scheduled_at,
                    'customer_note' => $item->customer_note,
                    'vendor_note' => $item->vendor_note,
                ]);

            return response()->json([
                'vendor_info' => [
                    'id' => $vendor->id,
                    'company_name' => $vendor->company_name,
                    'license_num' => $vendor->license_num,
                    'description' => $vendor->description,
                ],
                'asset_usage' => $assetUsage,
                'active_rentals' => $activeRentals,
                'upcoming_projections' => (float)$incomeProjections,
                'average_rating' => round((float)$avgRating, 1),
                'reviews_count' => $reviewsCount,
                'sale_revenue' => round($saleRevenue, 2),
                'rental_revenue' => round($rentalRevenue, 2),
                'total_revenue' => round($saleRevenue + $rentalRevenue, 2),
                'revenue_mix' => $revenueMix,
                'category_mix' => $categoryMix,
                'top_equipment' => $topEquipment,
                'monthly_revenue' => $this->serialiseBuckets($buckets),
                'pending_fulfillments' => $pendingFulfillments,
                'pending_count' => $pendingFulfillments->count(),
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Pharmacy analytics, scoped to the pharmacist's own listings.
     *
     * Medicines carry an owning pharmacist, so these figures cover only what
     * this account listed. Listings with no owner, which is what an admin
     * creates and what the catalogue held before ownership existed, are
     * included so nothing falls off the books entirely.
     */
    public function pharmacyDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $isStaff = $user->isAdmin() || $user->isSuperAdmin();

            if (!$user->isPharmacist() && !$isStaff) {
                return response()->json(['errors' => 'Only pharmacy staff can view this dashboard.'], 403);
            }

            $profileId = $user->pharmacistProfile?->id;

            // Admins see the whole catalogue; a pharmacist sees their own rows
            // plus the unowned ones.
            $ownedMedicineIds = $isStaff
                ? null
                : Medicine::where('pharmacist_id', $profileId)
                    ->orWhereNull('pharmacist_id')
                    ->pluck('id');

            // Cancelled orders put their stock back, so counting them as sales
            // would report revenue that was refunded.
            $lines = OrderItem::with([
                    'medicine:id,name,brand,generic_name,price,stock',
                    'medicine.categories:id,name',
                    'order:id,order_date,order_status,is_subscription_renewal',
                ])
                ->where('item_type', OrderItem::TYPE_MEDICINE)
                ->when($ownedMedicineIds !== null, fn ($q) => $q->whereIn('medicine_id', $ownedMedicineIds))
                ->whereHas('order', fn ($q) => $q->where('order_status', '!=', 'canceled'))
                ->get();

            $revenue = 0.0;
            $units = 0;
            $orderIds = [];
            $medicineTotals = [];
            $medicineUnits = [];
            $categoryTotals = [];
            $repeatMix = ['First orders' => 0.0, 'Subscription renewals' => 0.0];
            $buckets = $this->monthBuckets();

            foreach ($lines as $line) {
                $lineTotal = $this->orderItemTotal($line);
                $quantity = max(1, (int) $line->quantity);

                $revenue += $lineTotal;
                $units += $quantity;
                $orderIds[$line->order_id] = true;

                $name = $line->medicine->name ?? 'Medicine';
                $medicineTotals[$name] = ($medicineTotals[$name] ?? 0) + $lineTotal;
                $medicineUnits[$name] = ($medicineUnits[$name] ?? 0) + $quantity;

                // First category only. A medicine can sit in several, and
                // adding the same money to each would inflate the total past
                // the actual revenue.
                $category = $line->medicine?->categories->first()->name ?? 'Uncategorised';
                $categoryTotals[$category] = ($categoryTotals[$category] ?? 0) + $lineTotal;

                $repeatMix[$line->order?->is_subscription_renewal ? 'Subscription renewals' : 'First orders'] += $lineTotal;

                $key = $line->order?->order_date
                    ? Carbon::parse($line->order->order_date)->format('Y-m')
                    : null;

                if ($key && isset($buckets[$key])) {
                    $buckets[$key]['value'] += $lineTotal;
                    $buckets[$key]['count'] += $quantity;
                }
            }

            arsort($medicineTotals);
            arsort($medicineUnits);
            arsort($categoryTotals);

            // Stock health, which is the half of this job the sales figures
            // cannot show: what is about to run out.
            $medicines = Medicine::select('id', 'name', 'brand', 'generic_name', 'price', 'stock')
                ->when($ownedMedicineIds !== null, fn ($q) => $q->whereIn('id', $ownedMedicineIds))
                ->get();

            $outOfStock = $medicines->where('stock', '<=', 0)
                ->sortBy('name')
                ->values()
                ->map(fn ($medicine) => [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'brand' => $medicine->brand,
                    'generic_name' => $medicine->generic_name,
                    'stock' => (int) $medicine->stock,
                ]);

            $lowStock = $medicines->where('stock', '>', 0)
                ->where('stock', '<=', self::LOW_STOCK_THRESHOLD)
                ->sortBy('stock')
                ->values()
                ->map(fn ($medicine) => [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'brand' => $medicine->brand,
                    'generic_name' => $medicine->generic_name,
                    'stock' => (int) $medicine->stock,
                ]);

            // Latest movements, so a pharmacist can see a sale land rather than
            // only a total that moved.
            $recentSales = $lines
                ->sortByDesc(fn ($line) => $line->order?->order_date)
                ->take(10)
                ->values()
                ->map(fn ($line) => [
                    'order_id' => $line->order_id,
                    'medicine' => $line->medicine->name ?? 'Medicine',
                    'quantity' => (int) $line->quantity,
                    'line_total' => round($this->orderItemTotal($line), 2),
                    'order_date' => $line->order?->order_date,
                    'order_status' => $line->order?->order_status,
                ]);

            $unitShares = [];
            foreach (array_slice($medicineUnits, 0, 5, true) as $name => $quantity) {
                $unitShares[$name] = (float) $quantity;
            }

            return response()->json([
                'medicines_count' => $medicines->count(),
                'orders_count' => count($orderIds),
                'units_sold' => $units,
                'total_revenue' => round($revenue, 2),
                'average_order_value' => count($orderIds) > 0
                    ? round($revenue / count($orderIds), 2)
                    : 0.0,
                'out_of_stock_count' => $outOfStock->count(),
                'low_stock_count' => $lowStock->count(),
                'low_stock_threshold' => self::LOW_STOCK_THRESHOLD,
                'out_of_stock' => $outOfStock,
                'low_stock' => $lowStock,
                'top_medicines' => $this->toShares(array_slice($medicineTotals, 0, 5, true)),
                'top_by_units' => $this->toShares($unitShares),
                'category_mix' => $this->toShares(array_slice($categoryTotals, 0, 6, true)),
                'repeat_mix' => $this->toShares($repeatMix),
                'monthly_revenue' => $this->serialiseBuckets($buckets),
                'recent_sales' => $recentSales,
                // Says whose numbers these are, so nobody reads a pharmacist's
                // figures as platform wide or the reverse.
                'scope_note' => $isStaff
                    ? 'Admin view: every medicine on the platform.'
                    : 'Your listings, plus any medicine the platform owns.',
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function ambulanceDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $company = null;

            // Admin / Super Admin can view any ambulance dashboard
            if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('ambulance_company_id')) {
                $company = AmbulanceCompany::find($request->ambulance_company_id);
            } else if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('user_id')) {
                $company = AmbulanceCompany::where('user_id', $request->user_id)->first();
            } else {
                $company = AmbulanceCompany::where('user_id', $user->id)->first();
            }

            // Fallback for admin if no company selected
            if (!$company && ($user->isAdmin() || $user->isSuperAdmin())) {
                $company = AmbulanceCompany::first();
            }

            if (!$company) {
                return response()->json(['errors' => 'Authorized ambulance company profile not found.'], 403);
            }

            // 1. Trips. A run that is still under way has no completion time
            // and a response delay of 0, so counting those as completed both
            // inflated the trip count and dragged the average delay down.
            $trips = AmbulanceTrip::with('vehicle')
                ->where('ambulance_company_id', $company->id)
                ->orderByDesc('dispatch_time')
                ->get();

            $completed = $trips->filter(fn ($trip) => $trip->completion_time !== null);

            $completedTripsCount = $completed->count();

            // 2. Average response delay, over finished runs only
            $avgDelay = $completed->avg('response_delay_minutes') ?: 0.0;

            // 3. Total revenue, from the fares recorded at dispatch
            $totalRevenue = $completed->sum('revenue') ?: 0.0;

            // 4. Individual vehicle efficiency
            $vehicles = AmbulanceVehicle::where('ambulance_company_id', $company->id)->get();
            $vehicleEfficiency = $vehicles->map(function ($vehicle) use ($completed) {
                // Per vehicle figures use the same finished-runs rule as the
                // headline ones, so the columns add up to the totals above.
                $vTrips = $completed->where('vehicle_id', $vehicle->id);
                $vTripsCount = $vTrips->count();
                $vAvgDelay = $vTrips->avg('response_delay_minutes') ?: 0.0;
                $vRevenue = $vTrips->sum('revenue') ?: 0.0;

                return [
                    'id' => $vehicle->id,
                    'vehicle_number' => $vehicle->vehicle_number,
                    'model' => $vehicle->model,
                    'status' => $vehicle->status,
                    'trips_count' => $vTripsCount,
                    'average_response_delay' => round($vAvgDelay, 1),
                    'total_revenue' => (float)$vRevenue,
                ];
            });

            // 5. Revenue share per vehicle
            $vehicleTotals = [];
            foreach ($vehicleEfficiency as $vehicle) {
                $vehicleTotals[$vehicle['vehicle_number']] = $vehicle['total_revenue'];
            }
            arsort($vehicleTotals);
            $vehicleRevenueMix = $this->toShares($vehicleTotals);

            // 6. Six month trip volume and revenue
            $revenueBuckets = $this->monthBuckets();
            foreach ($completed as $trip) {
                if (!$trip->completion_time) {
                    continue;
                }
                $key = Carbon::parse($trip->completion_time)->format('Y-m');
                if (isset($revenueBuckets[$key])) {
                    $revenueBuckets[$key]['value'] += (float) $trip->revenue;
                    $revenueBuckets[$key]['count']++;
                }
            }

            // 7. How response delays are distributed, so slow tails are visible
            $delayBands = [
                'Under 5 min' => 0,
                '5 to 10 min' => 0,
                '10 to 20 min' => 0,
                'Over 20 min' => 0,
            ];
            foreach ($completed as $trip) {
                $delay = (float) $trip->response_delay_minutes;
                if ($delay < 5) {
                    $delayBands['Under 5 min']++;
                } elseif ($delay < 10) {
                    $delayBands['5 to 10 min']++;
                } elseif ($delay < 20) {
                    $delayBands['10 to 20 min']++;
                } else {
                    $delayBands['Over 20 min']++;
                }
            }

            // 8. Fleet availability at a glance
            $fleetStatus = [];
            foreach ($vehicles as $vehicle) {
                $status = $vehicle->status ?: 'unknown';
                $fleetStatus[$status] = ($fleetStatus[$status] ?? 0) + 1;
            }

            return response()->json([
                'company_info' => [
                    'id' => $company->id,
                    'company_name' => $company->company_name,
                    'license_num' => $company->license_num,
                    'description' => $company->description,
                ],
                'completed_trips_count' => $completedTripsCount,
                'completed_trips' => $completed->values(),
                'average_response_delay' => round((float)$avgDelay, 1),
                'total_revenue' => (float)$totalRevenue,
                'average_revenue_per_trip' => $completedTripsCount > 0
                    ? round($totalRevenue / $completedTripsCount, 2)
                    : 0.0,
                'vehicle_efficiency' => $vehicleEfficiency,
                'vehicle_revenue_mix' => $vehicleRevenueMix,
                'monthly_revenue' => $this->serialiseBuckets($revenueBuckets),
                'delay_distribution' => $this->toShares(array_map('floatval', $delayBands)),
                'fleet_status' => $this->toShares(array_map('floatval', $fleetStatus)),
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Spending analytics for a customer: how their money splits across medicines,
     * equipment bought outright and equipment rented, plus a six month trend.
     */
    public function customerDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $targetId = $user->id;

            // Admins can inspect any customer's spending.
            if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('user_id')) {
                $targetId = $request->input('user_id');
            }

            // The membership shown has to belong to whoever is being viewed.
            // Reading it off the caller meant an admin inspecting a customer
            // saw their own premium status on that customer's page.
            $target = (int) $targetId === (int) $user->id
                ? $user
                : User::find($targetId) ?? $user;

            $orders = Order::with(['orderItems.medicine:id,name', 'orderItems.equipment:id,name,category'])
                ->where('user_id', $targetId)
                ->where('order_status', '!=', 'canceled')
                ->get();

            $spend = [
                'Medicines' => 0.0,
                'Equipment purchases' => 0.0,
                'Equipment rentals' => 0.0,
            ];

            $categoryTotals = [];
            $itemTotals = [];
            $buckets = $this->monthBuckets();

            foreach ($orders as $order) {
                $orderKey = $order->order_date
                    ? Carbon::parse($order->order_date)->format('Y-m')
                    : null;

                foreach ($order->orderItems as $item) {
                    $lineTotal = $this->orderItemTotal($item);

                    $bucketLabel = match ($item->item_type) {
                        OrderItem::TYPE_EQUIPMENT_PURCHASE => 'Equipment purchases',
                        OrderItem::TYPE_EQUIPMENT_RENTAL => 'Equipment rentals',
                        default => 'Medicines',
                    };
                    $spend[$bucketLabel] += $lineTotal;

                    if ($item->isEquipment() && $item->equipment) {
                        $category = $item->equipment->category ?? 'Uncategorised';
                        $categoryTotals[$category] = ($categoryTotals[$category] ?? 0) + $lineTotal;
                        $name = $item->equipment->name ?? 'Equipment';
                    } else {
                        $name = $item->medicine->name ?? 'Medicine';
                    }

                    $itemTotals[$name] = ($itemTotals[$name] ?? 0) + $lineTotal;

                    if ($orderKey && isset($buckets[$orderKey])) {
                        $buckets[$orderKey]['value'] += $lineTotal;
                        $buckets[$orderKey]['count']++;
                    }
                }
            }

            arsort($categoryTotals);
            arsort($itemTotals);

            $activeRentals = EquipmentRental::where('user_id', $targetId)
                ->where('status', 'active')
                ->count();

            $openHandovers = EquipmentFulfillment::where('user_id', $targetId)
                ->open()
                ->count();

            return response()->json([
                'orders_count' => $orders->count(),
                'total_spend' => round(array_sum($spend), 2),
                // Charges that sit outside the item lines, added when delivery
                // pricing and the premium card discount were introduced.
                'delivery_spend' => round((float) $orders->sum('delivery_charge'), 2),
                'premium_savings' => round((float) $orders->sum('premium_discount'), 2),
                'subscription_savings' => round((float) $orders->sum('discount_amount'), 2),
                'is_premium' => $target->hasActivePremium(),
                'premium_expires_at' => $target->premium_expires_at,
                'spend_mix' => $this->toShares($spend),
                'category_mix' => $this->toShares(array_slice($categoryTotals, 0, 6, true)),
                'top_items' => $this->toShares(array_slice($itemTotals, 0, 5, true)),
                'monthly_spend' => $this->serialiseBuckets($buckets),
                'active_rentals' => $activeRentals,
                'open_handovers' => $openHandovers,
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Older order rows predate the line_total column, so fall back to
     * recomputing from the catalogue price.
     */
    private function orderItemTotal(OrderItem $item): float
    {
        if ($item->line_total !== null) {
            return (float) $item->line_total;
        }

        if ($item->unit_price !== null) {
            return round((float) $item->unit_price * max(1, $item->quantity), 2);
        }

        if ($item->medicine) {
            return round((float) $item->medicine->price * max(1, $item->quantity), 2);
        }

        // Equipment had no fallback at all, so an old equipment line counted as
        // zero and quietly shrank the customer's equipment spend.
        if ($item->equipment) {
            $price = $item->item_type === OrderItem::TYPE_EQUIPMENT_RENTAL
                ? $item->equipment->price_per_day
                : $item->equipment->sale_price;

            return round((float) ($price ?? 0) * max(1, $item->quantity), 2);
        }

        return 0.0;
    }
}
