<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentRental;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EquipmentRentalController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Renting is a customer-only action; vendors list equipment rather than book it.
        if (Auth::user()->resolveRole() !== 'user') {
            return response()->json(['errors' => 'Only customer accounts can rent equipment.'], 403);
        }

        try {
            $validated = $request->validate([
                'equipment_id' => 'required|exists:equipment,id',
                'rental_start' => 'required|date|after_or_equal:today',
                'rental_end' => 'required|date|after_or_equal:rental_start',
            ]);

            $equipment = Equipment::find($validated['equipment_id']);

            if (!$equipment->is_available || $equipment->quantity <= 0) {
                return response()->json(['errors' => 'This equipment is currently unavailable for rent.'], 422);
            }

            $user = Auth::user();
            $start = Carbon::parse($validated['rental_start']);
            $end = Carbon::parse($validated['rental_end']);
            $days = $start->diffInDays($end) + 1; // inclusive of start/end days

            $totalPrice = $days * $equipment->price_per_day;

            // Decrement equipment quantity
            $equipment->quantity -= 1;
            if ($equipment->quantity <= 0) {
                $equipment->is_available = false;
            }
            $equipment->save();

            $rental = EquipmentRental::create([
                'user_id' => $user->id,
                'equipment_id' => $equipment->id,
                'vendor_id' => $equipment->vendor_id,
                'rental_start' => $validated['rental_start'],
                'rental_end' => $validated['rental_end'],
                'total_price' => $totalPrice,
                'status' => 'active',
            ]);

            // Create notification
            Notification::create([
                'user_id' => $user->id,
                'subject' => 'Equipment Rental Confirmed',
                'message' => "You have rented {$equipment->name} from {$start->format('Y-m-d')} to {$end->format('Y-m-d')} for a total of \${$totalPrice}.",
                'is_read' => false,
            ]);

            return response()->json([
                'success' => 'Equipment rented successfully.',
                'data' => $rental
            ], 201);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'Failed to process equipment rental.'], 500);
        }
    }
}
