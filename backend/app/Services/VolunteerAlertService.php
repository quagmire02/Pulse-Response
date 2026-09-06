<?php

namespace App\Services;

use App\Models\EmergencyAlert;
use App\Models\Notification;
use App\Models\Volunteer;
use App\Models\VolunteerAlert;
use Illuminate\Support\Facades\Log;

class VolunteerAlertService
{
        public const RADIUS_KM = 2.5;

        public const MAX_VOLUNTEERS = 10;

    public function __construct(private DispatchService $dispatch)
    {
    }

        public function notifyNearby(EmergencyAlert $alert, ?string $etaNote = null): array
    {
        if ($alert->latitude === null || $alert->longitude === null) {
            return ['notified' => 0, 'radius_km' => self::RADIUS_KM];
        }

        try {
            $candidates = Volunteer::reachable()->with('user:id,username')->get();

            $inRange = [];

            foreach ($candidates as $volunteer) {
                if ($volunteer->user_id === $alert->user_id) {
                    continue;
                }

                $distance = $this->dispatch->distanceKm(
                    $alert->latitude,
                    $alert->longitude,
                    $volunteer->current_lat,
                    $volunteer->current_lng
                );

                if ($distance <= self::RADIUS_KM) {
                    $inRange[] = ['volunteer' => $volunteer, 'distance' => round($distance, 2)];
                }
            }

            usort($inRange, fn ($a, $b) => $a['distance'] <=> $b['distance']);
            $inRange = array_slice($inRange, 0, self::MAX_VOLUNTEERS);

            foreach ($inRange as $entry) {
                $volunteer = $entry['volunteer'];

                $record = VolunteerAlert::firstOrCreate(
                    [
                        'emergency_alert_id' => $alert->id,
                        'volunteer_id' => $volunteer->id,
                    ],
                    [
                        'distance_km' => $entry['distance'],
                        'status' => VolunteerAlert::STATUS_NOTIFIED,
                    ]
                );

                if (!$record->wasRecentlyCreated) {
                    continue;
                }

                Notification::create([
                    'user_id' => $volunteer->user_id,
                    'subject' => 'Emergency near you',
                    'message' => 'A ' . str_replace('_', ' ', $alert->alert_type)
                        . " emergency was reported {$entry['distance']} km away at {$alert->location}."
                        . ($etaNote ? ' ' . $etaNote : '')
                        . ' Open your volunteer console for details.',
                    'is_read' => false,
                ]);
            }

            return ['notified' => count($inRange), 'radius_km' => self::RADIUS_KM];
        } catch (\Exception $e) {
            Log::error('Volunteer alert scan failed: ' . $e->getMessage());

            return ['notified' => 0, 'radius_km' => self::RADIUS_KM];
        }
    }

        public function respondersFor(EmergencyAlert $alert): array
    {
        try {
            return VolunteerAlert::with('volunteer.user:id,username')
                ->where('emergency_alert_id', $alert->id)
                ->where('status', VolunteerAlert::STATUS_RESPONDED)
                ->orderBy('responded_at')
                ->get()
                ->map(fn ($record) => [
                    'name' => $record->volunteer->user->username ?? 'A volunteer',
                    'skills' => $record->volunteer->skills ?? null,
                    'distance_km' => $record->distance_km,
                    'responded_at' => $record->responded_at,
                ])
                ->all();
        } catch (\Exception $e) {
            Log::error('Loading volunteer responders failed: ' . $e->getMessage());
            return [];
        }
    }

        public function closeAlert(EmergencyAlert $alert, string $status = VolunteerAlert::STATUS_CLOSED): void
    {
        try {
            $records = VolunteerAlert::with('volunteer')
                ->where('emergency_alert_id', $alert->id)
                ->whereIn('status', [VolunteerAlert::STATUS_NOTIFIED, VolunteerAlert::STATUS_RESPONDED])
                ->get();

            foreach ($records as $record) {
                $record->update(['status' => $status]);

                if ($record->volunteer) {
                    Notification::create([
                        'user_id' => $record->volunteer->user_id,
                        'subject' => $status === VolunteerAlert::STATUS_CANCELLED
                            ? 'Nearby emergency cancelled'
                            : 'Nearby emergency resolved',
                        'message' => $status === VolunteerAlert::STATUS_CANCELLED
                            ? "The emergency at {$alert->location} was cancelled. Stand down."
                            : "The ambulance has handled the emergency at {$alert->location}. Thank you.",
                        'is_read' => false,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Closing volunteer alerts failed: ' . $e->getMessage());
        }
    }
}
