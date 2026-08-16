<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Models\EquipmentFulfillment;
use App\Models\Notification;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * The handover conversation between a customer and a vendor for equipment on an
 * order: the customer says where and when they want it, the vendor confirms a
 * slot and leaves a note back.
 */
class EquipmentFulfillmentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Statuses a vendor is allowed to move a request into.
     *
     * @var array<int, string>
     */
    private const VENDOR_STATUSES = [
        EquipmentFulfillment::STATUS_CONFIRMED,
        EquipmentFulfillment::STATUS_SCHEDULED,
        EquipmentFulfillment::STATUS_HANDED_OVER,
        EquipmentFulfillment::STATUS_RETURNED,
        EquipmentFulfillment::STATUS_CANCELLED,
    ];

    /**
     * List the requests visible to the caller: their own as a customer, the ones
     * against their listings as a vendor, everything as an admin.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            $query = EquipmentFulfillment::with([
                'equipment:id,name,category,image',
                'vendor:id,user_id,company_name,contact_phone',
                'user:id,username,first_name,last_name,email',
                'order:id,order_date,order_status',
            ]);

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                $vendor = Vendor::where('user_id', $user->id)->first();

                if ($vendor) {
                    $query->where('vendor_id', $vendor->id);
                } else {
                    $query->where('user_id', $user->id);
                }
            }

            $query->filterByStatus($request->input('status'));

            if ($request->boolean('open_only')) {
                $query->open();
            }

            $perPage = $request->input('per_page', 15);
            $fulfillments = $query->orderByDesc('created_at')->orderByDesc('id')->paginate($perPage);

            return response()->json($fulfillments, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Vendor side: confirm, schedule a handover, or close the request out.
     */
    public function update(Request $request, string $fulfillment): JsonResponse
    {
        try {
            $found = EquipmentFulfillment::with('equipment', 'vendor')->find($fulfillment);

            if (!$found) {
                return response()->json(['errors' => 'Fulfillment request not found.'], 404);
            }

            $user = Auth::user();
            $vendor = Vendor::where('user_id', $user->id)->first();
            $isOwner = $vendor && $vendor->id === $found->vendor_id;

            if (!$isOwner && !$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['errors' => 'You are not authorized to update this request.'], 403);
            }

            $validated = $request->validate([
                'status' => ['sometimes', Rule::in(self::VENDOR_STATUSES)],
                'handover_scheduled_at' => ['nullable', 'date'],
                'vendor_note' => ['nullable', 'string', 'max:1000'],
            ]);

            // Naming a time implies the handover is scheduled unless told otherwise.
            if (!empty($validated['handover_scheduled_at']) && empty($validated['status'])) {
                $validated['status'] = EquipmentFulfillment::STATUS_SCHEDULED;
            }

            $found->update($validated);

            // Returning a rental frees the unit back onto the shelf.
            if (($validated['status'] ?? null) === EquipmentFulfillment::STATUS_RETURNED) {
                if ($found->rental) {
                    $found->rental->update(['status' => 'returned']);
                }

                if ($found->equipment) {
                    $found->equipment->quantity += $found->quantity;
                    $found->equipment->is_available = true;
                    $found->equipment->save();
                }
            }

            $this->notifyCustomer($found);

            return response()->json([
                'success' => 'Fulfillment request updated.',
                'data' => $found->fresh(),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Customer side: adjust where they want the handover and leave a note, as
     * long as the vendor has not handed it over yet.
     */
    public function updateByCustomer(Request $request, string $fulfillment): JsonResponse
    {
        try {
            $found = EquipmentFulfillment::with('vendor')->find($fulfillment);

            if (!$found) {
                return response()->json(['errors' => 'Fulfillment request not found.'], 404);
            }

            if ($found->user_id !== Auth::user()->id) {
                return response()->json(['errors' => 'You are not authorized to update this request.'], 403);
            }

            if (!$found->isOpen()) {
                return response()->json([
                    'errors' => 'This request is already ' . $found->status . ' and can no longer be changed.',
                ], 409);
            }

            $validated = $request->validate([
                'handover_address' => ['sometimes', 'string', 'max:255'],
                'customer_phone' => ['sometimes', 'string', 'max:50'],
                'customer_note' => ['nullable', 'string', 'max:1000'],
            ]);

            $found->update($validated);

            if ($found->vendor && $found->vendor->user_id) {
                Notification::create([
                    'user_id' => $found->vendor->user_id,
                    'subject' => 'Handover details updated',
                    'message' => "The customer updated the handover details for order {$found->order_id}.",
                ]);
            }

            return response()->json([
                'success' => 'Handover details updated.',
                'data' => $found->fresh(),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    private function notifyCustomer(EquipmentFulfillment $fulfillment): void
    {
        $equipmentName = $fulfillment->equipment->name ?? 'your equipment';
        $message = "Your request for {$equipmentName} is now {$fulfillment->status}.";

        if ($fulfillment->handover_scheduled_at) {
            $message .= ' Handover is set for ' . $fulfillment->handover_scheduled_at->format('Y-m-d H:i') . '.';
        }

        if ($fulfillment->vendor_note) {
            $message .= ' Vendor note: ' . $fulfillment->vendor_note;
        }

        Notification::create([
            'user_id' => $fulfillment->user_id,
            'subject' => 'Equipment handover update',
            'message' => $message,
        ]);
    }
}
