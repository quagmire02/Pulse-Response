<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Volunteer;
use App\Models\VolunteerAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The volunteer side of the community alert system: report a position, see
 * incidents nearby, mark attendance, and spend the points that earns.
 */
class VolunteerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    private function currentVolunteer(): ?Volunteer
    {
        return Volunteer::where('user_id', Auth::user()->id)->first();
    }

    /**
     * Console payload: profile, points, nearby incidents, rewards catalogue.
     */
    public function me(): JsonResponse
    {
        try {
            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            $alerts = VolunteerAlert::with([
                    'emergencyAlert:id,alert_type,location,status,latitude,longitude,created_at,assigned_vehicle_id',
                    'emergencyAlert.assignedVehicle:id,vehicle_number',
                ])
                ->where('volunteer_id', $volunteer->id)
                ->orderByDesc('id')
                ->limit(25)
                ->get();

            return response()->json([
                'volunteer' => $volunteer,
                'is_online' => $volunteer->isOnline(),
                'alerts' => $alerts,
                'rewards' => $this->rewardCatalogue($volunteer),
                'points_per_incident' => Volunteer::POINTS_PER_INCIDENT,
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Position ping from the volunteer's device, same contract as the driver.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
            ]);

            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            $volunteer->update([
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
     * Go on or off duty. Off duty clears the last ping so the scan skips them.
     */
    public function setAvailability(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'is_available' => ['required', 'boolean'],
            ]);

            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            $volunteer->update([
                'is_available' => $validated['is_available'],
                'last_ping_at' => $validated['is_available'] ? $volunteer->last_ping_at : null,
            ]);

            return response()->json([
                'success' => $validated['is_available'] ? 'You are on duty.' : 'You are off duty.',
                'data' => $volunteer->fresh(),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Record that the volunteer attended an incident and award the points.
     *
     * There is no accept step: helping is the action, so this is logged after
     * the fact rather than claimed up front.
     */
    public function respond(string $volunteerAlert): JsonResponse
    {
        try {
            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            $record = VolunteerAlert::where('id', $volunteerAlert)
                ->where('volunteer_id', $volunteer->id)
                ->first();

            if (!$record) {
                return response()->json(['errors' => 'Alert not found.'], 404);
            }

            if ($record->status === VolunteerAlert::STATUS_RESPONDED || $record->points_awarded > 0) {
                return response()->json(['errors' => 'You already logged this incident.'], 409);
            }

            if ($record->status === VolunteerAlert::STATUS_CANCELLED) {
                return response()->json(['errors' => 'This emergency was cancelled.'], 409);
            }

            $points = Volunteer::POINTS_PER_INCIDENT;

            DB::transaction(function () use ($record, $volunteer, $points) {
                $record->update([
                    'status' => VolunteerAlert::STATUS_RESPONDED,
                    'responded_at' => now(),
                    'points_awarded' => $points,
                ]);

                $volunteer->increment('points', $points);
                $volunteer->increment('lifetime_points', $points);
                $volunteer->increment('incidents_helped');
            });

            // The patient asked for help and someone turned up. Telling them is
            // the whole point of the volunteer layer, so it happens here rather
            // than being left to the ambulance notification.
            $this->notifyPatient($record, $volunteer);

            return response()->json([
                'success' => "Thank you for helping. {$points} points added.",
                'data' => $volunteer->fresh(),
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Spend points on a cosmetic perk.
     */
    public function redeem(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reward' => ['required', 'string'],
            ]);

            $key = $validated['reward'];

            if (!array_key_exists($key, Volunteer::REWARDS)) {
                return response()->json(['errors' => 'Unknown reward.'], 422);
            }

            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            if ($volunteer->hasUnlocked($key)) {
                return response()->json(['errors' => 'You already own this.'], 409);
            }

            $reward = Volunteer::REWARDS[$key];

            if ($volunteer->points < $reward['cost']) {
                return response()->json([
                    'errors' => "You need {$reward['cost']} points for {$reward['name']}, you have {$volunteer->points}.",
                ], 422);
            }

            $unlocked = $volunteer->unlocked_rewards ?? [];
            $unlocked[] = $key;

            $volunteer->update([
                'points' => $volunteer->points - $reward['cost'],
                'unlocked_rewards' => array_values(array_unique($unlocked)),
            ]);

            return response()->json([
                'success' => "{$reward['name']} unlocked.",
                'data' => $volunteer->fresh(),
                'rewards' => $this->rewardCatalogue($volunteer->fresh()),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Switch to an owned theme or typeface. 'default' is always available.
     */
    public function applyReward(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'type' => ['required', 'in:theme,font'],
                'value' => ['required', 'string'],
            ]);

            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            if ($validated['value'] !== 'default') {
                $owned = false;

                foreach (Volunteer::REWARDS as $key => $reward) {
                    if ($reward['type'] === $validated['type']
                        && $reward['value'] === $validated['value']
                        && $volunteer->hasUnlocked($key)) {
                        $owned = true;
                        break;
                    }
                }

                if (!$owned) {
                    return response()->json(['errors' => 'Unlock that first.'], 403);
                }
            }

            $column = $validated['type'] === 'theme' ? 'active_theme' : 'active_font';

            $volunteer->update([$column => $validated['value']]);

            return response()->json(['success' => 'Appearance updated.', 'data' => $volunteer->fresh()], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Lightweight endpoint the layout calls to apply a volunteer's chosen
     * appearance. Returns defaults for everyone else rather than an error.
     */
    public function appearance(): JsonResponse
    {
        try {
            $volunteer = $this->currentVolunteer();

            // Non volunteers get the defaults rather than a 404, so the layout
            // can call this for everyone without branching.
            return response()->json([
                'theme' => $volunteer?->active_theme ?? 'default',
                'font' => $volunteer?->active_font ?? 'default',
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['theme' => 'default', 'font' => 'default'], 200);
        }
    }

    /**
     * Volunteer analytics, plus a small leaderboard for context.
     */
    public function stats(): JsonResponse
    {
        try {
            $volunteer = $this->currentVolunteer();

            if (!$volunteer) {
                return response()->json(['errors' => 'You do not have a volunteer profile.'], 404);
            }

            $alerts = VolunteerAlert::where('volunteer_id', $volunteer->id)->get();

            $notified = $alerts->count();
            $responded = $alerts->where('status', VolunteerAlert::STATUS_RESPONDED)->count();

            $leaderboard = Volunteer::with('user:id,username')
                ->orderByDesc('lifetime_points')
                ->limit(5)
                ->get()
                ->map(fn ($row, $index) => [
                    'rank' => $index + 1,
                    'name' => $row->user->username ?? 'Volunteer',
                    'points' => $row->lifetime_points,
                    'incidents' => $row->incidents_helped,
                    'is_you' => $row->id === $volunteer->id,
                ]);

            return response()->json([
                'points' => $volunteer->points,
                'lifetime_points' => $volunteer->lifetime_points,
                'incidents_helped' => $volunteer->incidents_helped,
                'alerts_received' => $notified,
                // How often being alerted turns into actually attending.
                'response_rate' => $notified > 0 ? round(($responded / $notified) * 100, 1) : 0.0,
                'average_distance_km' => $alerts->count() > 0
                    ? round((float) $alerts->avg('distance_km'), 2)
                    : 0.0,
                'leaderboard' => $leaderboard,
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    /**
     * Let the patient know a trained volunteer has reached them.
     *
     * Wrapped so a notification failure can never undo the points the
     * volunteer has already earned.
     */
    private function notifyPatient(VolunteerAlert $record, Volunteer $volunteer): void
    {
        try {
            $incident = $record->emergencyAlert;

            if (!$incident || !$incident->user_id) {
                return;
            }

            $name = $volunteer->user->username ?? 'A community volunteer';
            $skills = filled($volunteer->skills) ? " Trained in: {$volunteer->skills}." : '';

            Notification::create([
                'user_id' => $incident->user_id,
                'subject' => 'A volunteer is helping you',
                'message' => "{$name} has reached your emergency at {$incident->location} "
                    . "and is giving first aid until the ambulance arrives.{$skills}",
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify patient of volunteer response: ' . $e->getMessage());
        }
    }

    private function rewardCatalogue(Volunteer $volunteer): array
    {
        $catalogue = [];

        foreach (Volunteer::REWARDS as $key => $reward) {
            $catalogue[] = [
                'key' => $key,
                'name' => $reward['name'],
                'cost' => $reward['cost'],
                'type' => $reward['type'],
                'value' => $reward['value'],
                'unlocked' => $volunteer->hasUnlocked($key),
                'affordable' => $volunteer->points >= $reward['cost'],
            ];
        }

        return $catalogue;
    }
}
