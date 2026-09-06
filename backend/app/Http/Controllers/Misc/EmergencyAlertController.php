<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceTrip;
use App\Models\EmergencyAlert;
use App\Models\Notification;
use App\Services\DispatchService;
use App\Services\VolunteerAlertService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmergencyAlertController extends Controller
{
    public function __construct(
        private DispatchService $dispatch,
        private VolunteerAlertService $volunteers
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'alert_type' => 'required|string',
                'location' => 'required|string',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'notes' => 'nullable|string',
            ]);

            $user = Auth::user();

            $alert = EmergencyAlert::create([
                'user_id' => $user->id,
                'alert_type' => $validated['alert_type'],
                'status' => 'pending',
                'location' => $validated['location'],
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $dispatchResult = null;
            $volunteerResult = null;

            // Coordinates are optional; without them the alert is still logged,
            // it just cannot be auto routed to a vehicle.
            if ($alert->latitude !== null && $alert->longitude !== null) {
                $dispatchResult = $this->assignNearestVehicle($alert);

                // Volunteers are pulled in whether or not an ambulance was
                // found. If none was, they matter more, not less.
                $volunteerResult = $this->volunteers->notifyNearby(
                    $alert,
                    $dispatchResult
                        ? "An ambulance is about {$dispatchResult['eta_minutes']} minutes away."
                        : 'No ambulance is available yet.'
                );
            }

            Notification::create([
                'user_id' => $user->id,
                'subject' => 'Emergency Alert Triggered',
                'message' => $dispatchResult
                    ? "Ambulance {$dispatchResult['vehicle_number']} is on the way to {$validated['location']}. Estimated arrival in {$dispatchResult['eta_minutes']} minutes."
                    : "Emergency request for " . str_replace('_', ' ', $validated['alert_type']) . " has been logged for {$validated['location']}. No ambulance is online right now, an operator will follow up.",
                'is_read' => false,
            ]);

            return response()->json([
                'success' => 'Emergency alert sent successfully.',
                'data' => $alert->fresh('assignedVehicle'),
                'dispatch' => $dispatchResult,
                'volunteers' => $volunteerResult,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'Failed to trigger emergency alert.'], 500);
        }
    }

    /**
     * Live tracking for the patient who raised the alert.
     *
     * Returns where the assigned ambulance actually is right now, not just the
     * coordinates it was dispatched from. The frontend polls this while the
     * vehicle is en route so the marker moves.
     */
    public function tracking(?string $alert = null): JsonResponse
    {
        try {
            $user = Auth::user();

            $query = EmergencyAlert::with([
                'assignedVehicle:id,ambulance_company_id,driver_user_id,vehicle_number,model,status,current_lat,current_lng,last_ping_at',
                'assignedVehicle.company:id,company_name,contact_phone',
                'assignedVehicle.driver:id,username,first_name,last_name',
            ])->where('user_id', $user->id);

            if ($alert) {
                $query->where('id', $alert);
            } else {
                // No id given means "whatever is happening to me right now".
                $query->whereIn('status', ['pending', 'dispatched'])->latest('id');
            }

            $emergency = $query->first();

            if (!$emergency) {
                return response()->json(['data' => null], 200);
            }

            $vehicle = $emergency->assignedVehicle;
            $volunteers = $this->volunteers->respondersFor($emergency);

            return response()->json([
                'data' => [
                    'alert' => [
                        'id' => $emergency->id,
                        'alert_type' => $emergency->alert_type,
                        'status' => $emergency->status,
                        'location' => $emergency->location,
                        'latitude' => $emergency->latitude,
                        'longitude' => $emergency->longitude,
                        'eta_minutes' => $emergency->assigned_eta_minutes,
                        'distance_km' => $emergency->assigned_distance_km,
                        'created_at' => $emergency->created_at,
                    ],
                    'ambulance' => $vehicle ? [
                        'vehicle_number' => $vehicle->vehicle_number,
                        'model' => $vehicle->model,
                        'status' => $vehicle->status,
                        // Where it is now, which is the point of this endpoint.
                        'latitude' => $vehicle->current_lat,
                        'longitude' => $vehicle->current_lng,
                        'last_ping_at' => $vehicle->last_ping_at,
                        'is_online' => $vehicle->isOnline(),
                        'driver_name' => $vehicle->driver->username ?? null,
                        'company_name' => $vehicle->company->company_name ?? null,
                        // Users have no phone column, so the dispatch desk
                        // number is the real contact we can offer.
                        'contact_phone' => $vehicle->company->contact_phone ?? null,
                        // Straight line, recalculated from the live position
                        // rather than reusing the distance fixed at dispatch.
                        'remaining_km' => $this->remainingKm($emergency, $vehicle),
                    ] : null,
                    'volunteers' => $volunteers,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => 'Failed to load tracking information.'], 500);
        }
    }

    /**
     * How far the ambulance still has to travel, from its latest ping.
     */
    private function remainingKm(EmergencyAlert $alert, $vehicle): ?float
    {
        if ($alert->latitude === null || $alert->longitude === null
            || $vehicle->current_lat === null || $vehicle->current_lng === null) {
            return null;
        }

        return round($this->dispatch->distanceKm(
            (float) $vehicle->current_lat,
            (float) $vehicle->current_lng,
            (float) $alert->latitude,
            (float) $alert->longitude
        ), 2);
    }

    /**
     * Find the closest online ambulance, reserve it, open a trip and tell the driver.
     *
     * @return array<string, mixed>|null
     */
    private function assignNearestVehicle(EmergencyAlert $alert): ?array
    {
        $nearest = $this->dispatch->findNearestVehicle($alert->latitude, $alert->longitude);

        if (!$nearest) {
            return null;
        }

        $vehicle = $nearest['vehicle'];

        $route = $this->dispatch->route(
            $vehicle->current_lat,
            $vehicle->current_lng,
            $alert->latitude,
            $alert->longitude
        );

        DB::transaction(function () use ($alert, $vehicle, $route) {
            // Taking the vehicle off the pool keeps a second alert from double booking it.
            $vehicle->update(['status' => 'busy']);

            $alert->update([
                'status' => 'dispatched',
                'assigned_vehicle_id' => $vehicle->id,
                'assigned_distance_km' => $route['distance_km'],
                'assigned_eta_minutes' => $route['eta_minutes'],
            ]);

            AmbulanceTrip::create([
                'ambulance_company_id' => $vehicle->ambulance_company_id,
                'vehicle_id' => $vehicle->id,
                'emergency_alert_id' => $alert->id,
                'patient_name' => $alert->user->username ?? null,
                'dispatch_time' => now(),
                // The callout fare, so the ambulance company's revenue
                // reporting has something to report.
                'revenue' => AmbulanceTrip::calculateFare($route['distance_km']),
            ]);

            if ($vehicle->driver_user_id) {
                Notification::create([
                    'user_id' => $vehicle->driver_user_id,
                    'subject' => 'New emergency assignment',
                    'message' => "Respond to {$alert->location}. Distance {$route['distance_km']} km, about {$route['eta_minutes']} minutes.",
                    'is_read' => false,
                ]);
            }
        });

        return [
            'vehicle_id' => $vehicle->id,
            'vehicle_number' => $vehicle->vehicle_number,
            'distance_km' => $route['distance_km'],
            'eta_minutes' => $route['eta_minutes'],
            'geometry' => $route['geometry'],
        ];
    }
}
