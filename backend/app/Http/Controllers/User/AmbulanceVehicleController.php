<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceTrip;
use App\Models\AmbulanceVehicle;
use App\Models\EmergencyAlert;
use App\Models\Notification;
use App\Services\VolunteerAlertService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * The driver side of dispatch. The device pushes its own GPS position here on a
 * timer, the same contract a rideshare driver app uses. Nothing here reads a
 * location from a phone number, which is not possible outside a carrier.
 */
class AmbulanceVehicleController extends Controller
{
    public function __construct(private VolunteerAlertService $volunteers)
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * The vehicle the signed in driver is assigned to.
     */
    private function driverVehicle(): ?AmbulanceVehicle
    {
        return AmbulanceVehicle::where('driver_user_id', Auth::user()->id)->first();
    }

    /**
     * Everything the driver page needs: the vehicle, its duty state, and the
     * emergency it is currently responding to.
     */
    public function myVehicle(): JsonResponse
    {
        try {
            $vehicle = $this->driverVehicle();

            if (!$vehicle) {
                return response()->json(['errors' => 'You are not assigned to any ambulance.'], 404);
            }

            $alert = EmergencyAlert::with('user:id,username,first_name,last_name')
                ->where('assigned_vehicle_id', $vehicle->id)
                ->where('status', 'dispatched')
                ->latest('id')
                ->first();

            return response()->json([
                'vehicle' => $vehicle->load('company:id,company_name'),
                'is_online' => $vehicle->isOnline(),
                'assignment' => $alert,
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Position ping from the driver browser. Called every few seconds while the
     * driver is on duty.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
            ]);

            $vehicle = $this->driverVehicle();

            if (!$vehicle) {
                return response()->json(['errors' => 'You are not assigned to any ambulance.'], 404);
            }

            $vehicle->update([
                'current_lat' => $validated['latitude'],
                'current_lng' => $validated['longitude'],
                'last_ping_at' => now(),
            ]);

            return response()->json(['success' => 'Location updated.'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Driver goes on or off duty. Going to maintenance clears the last ping so a
     * parked vehicle is never picked by the dispatcher.
     */
    public function setStatus(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => ['required', Rule::in(['available', 'busy', 'maintenance'])],
            ]);

            $vehicle = $this->driverVehicle();

            if (!$vehicle) {
                return response()->json(['errors' => 'You are not assigned to any ambulance.'], 404);
            }

            $updates = ['status' => $validated['status']];

            if ($validated['status'] === 'maintenance') {
                $updates['last_ping_at'] = null;
            }

            $vehicle->update($updates);

            return response()->json(['success' => 'Status updated.', 'data' => $vehicle->fresh()], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Driver marks the current run finished. Closes the trip, records how long
     * the response actually took, and frees the vehicle for the next call.
     */
    public function completeAssignment(string $alert): JsonResponse
    {
        try {
            $vehicle = $this->driverVehicle();

            if (!$vehicle) {
                return response()->json(['errors' => 'You are not assigned to any ambulance.'], 404);
            }

            $emergency = EmergencyAlert::where('id', $alert)
                ->where('assigned_vehicle_id', $vehicle->id)
                ->first();

            if (!$emergency) {
                return response()->json(['errors' => 'Assignment not found.'], 404);
            }

            $trip = AmbulanceTrip::where('emergency_alert_id', $emergency->id)
                ->where('vehicle_id', $vehicle->id)
                ->latest('id')
                ->first();

            if ($trip) {
                $trip->update([
                    'arrival_time' => $trip->arrival_time ?? now(),
                    'completion_time' => now(),
                    // Actual minutes elapsed, which the analytics dashboard averages.
                    'response_delay_minutes' => $trip->dispatch_time
                        ? (int) $trip->dispatch_time->diffInMinutes(now())
                        : 0,
                ]);
            }

            $emergency->update(['status' => 'resolved']);
            $vehicle->update(['status' => 'available']);

            // Stand the nearby volunteers down; the ambulance has it.
            $this->volunteers->closeAlert($emergency);

            Notification::create([
                'user_id' => $emergency->user_id,
                'subject' => 'Emergency resolved',
                'message' => "Ambulance {$vehicle->vehicle_number} has completed your emergency response.",
                'is_read' => false,
            ]);

            return response()->json(['success' => 'Assignment completed.'], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Register a new ambulance. Company owners add to their own fleet, admins
     * must name the company.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $isAdmin = $user->isAdmin() || $user->isSuperAdmin();
            $company = $user->ambulanceCompany;

            $validated = $request->validate([
                'vehicle_number' => ['required', 'string', 'max:255', 'unique:ambulance_vehicles,vehicle_number'],
                'model' => ['required', 'string', 'max:255'],
                'status' => ['sometimes', Rule::in(['available', 'busy', 'maintenance'])],
                'ambulance_company_id' => [
                    Rule::requiredIf(fn () => $isAdmin && !$company),
                    'nullable',
                    'exists:ambulance_companies,id',
                ],
            ]);

            $companyId = $company->id ?? null;

            if ($isAdmin && !empty($validated['ambulance_company_id'])) {
                $companyId = $validated['ambulance_company_id'];
            }

            if (!$companyId) {
                return response()->json(['errors' => 'No ambulance company profile found.'], 403);
            }

            $vehicle = AmbulanceVehicle::create([
                'ambulance_company_id' => $companyId,
                'vehicle_number' => $validated['vehicle_number'],
                'model' => $validated['model'],
                // New vehicles start off duty until a driver signs on.
                'status' => $validated['status'] ?? 'maintenance',
            ]);

            return response()->json(['success' => 'Ambulance added.', 'data' => $vehicle], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Edit an ambulance, including detaching its driver.
     */
    public function update(Request $request, string $vehicle): JsonResponse
    {
        try {
            $found = AmbulanceVehicle::find($vehicle);

            if (!$found) {
                return response()->json(['errors' => 'Ambulance not found.'], 404);
            }

            if (!$this->canManage($found)) {
                return response()->json(['errors' => 'You are not authorized to manage this ambulance.'], 403);
            }

            $validated = $request->validate([
                'vehicle_number' => [
                    'sometimes', 'string', 'max:255',
                    Rule::unique('ambulance_vehicles', 'vehicle_number')->ignore($found->id),
                ],
                'model' => ['sometimes', 'string', 'max:255'],
                'status' => ['sometimes', Rule::in(['available', 'busy', 'maintenance'])],
                'driver_user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            ]);

            $found->update($validated);

            return response()->json(['success' => 'Ambulance updated.', 'data' => $found->fresh()], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function destroy(string $vehicle): JsonResponse
    {
        try {
            $found = AmbulanceVehicle::find($vehicle);

            if (!$found) {
                return response()->json(['errors' => 'Ambulance not found.'], 404);
            }

            if (!$this->canManage($found)) {
                return response()->json(['errors' => 'You are not authorized to manage this ambulance.'], 403);
            }

            $found->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Ambulances with no driver attached yet, used by the driver approval picker.
     */
    public function unassigned(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['errors' => 'You are not authorized to view this.'], 403);
            }

            $vehicles = AmbulanceVehicle::with('company:id,company_name')
                ->whereNull('driver_user_id')
                ->orderBy('vehicle_number')
                ->get(['id', 'ambulance_company_id', 'vehicle_number', 'model', 'status']);

            return response()->json(['data' => $vehicles], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    private function canManage(AmbulanceVehicle $vehicle): bool
    {
        $user = Auth::user();

        if ($user->isAdmin() || $user->isSuperAdmin()) {
            return true;
        }

        $company = $user->ambulanceCompany;

        return $company && $company->id === $vehicle->ambulance_company_id;
    }

    /**
     * Live fleet positions for the company owner or an admin.
     */
    public function fleet(): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = AmbulanceVehicle::with('company:id,company_name,user_id', 'driver:id,username');

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                $company = $user->ambulanceCompany;

                if (!$company) {
                    return response()->json(['errors' => 'No ambulance company profile found.'], 403);
                }

                $query->where('ambulance_company_id', $company->id);
            }

            $vehicles = $query->get()->map(fn ($vehicle) => [
                'id' => $vehicle->id,
                'vehicle_number' => $vehicle->vehicle_number,
                'model' => $vehicle->model,
                'status' => $vehicle->status,
                'driver' => $vehicle->driver->username ?? null,
                'latitude' => $vehicle->current_lat,
                'longitude' => $vehicle->current_lng,
                'last_ping_at' => $vehicle->last_ping_at,
                'is_online' => $vehicle->isOnline(),
            ]);

            return response()->json(['data' => $vehicles], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }
}
