<?php

namespace App\Services;

use App\Models\AmbulanceVehicle;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DispatchService
{
        private const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

    private const EARTH_RADIUS_KM = 6371;

        private const ASSUMED_SPEED_KMH = 40;

        public function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
           + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return self::EARTH_RADIUS_KM * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

        public function findNearestVehicle(float $lat, float $lng): ?array
    {
        $vehicles = AmbulanceVehicle::dispatchable()->get();

        if ($vehicles->isEmpty()) {
            return null;
        }

        $nearest = null;
        $nearestDistance = INF;

        foreach ($vehicles as $vehicle) {
            $distance = $this->distanceKm($lat, $lng, $vehicle->current_lat, $vehicle->current_lng);

            if ($distance < $nearestDistance) {
                $nearest = $vehicle;
                $nearestDistance = $distance;
            }
        }

        return [
            'vehicle' => $nearest,
            'distance_km' => round($nearestDistance, 2),
        ];
    }

        public function route(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $fallback = $this->straightLineEstimate($fromLat, $fromLng, $toLat, $toLng);

        try {
            $response = Http::timeout(5)->get(
                self::OSRM_URL . "/{$fromLng},{$fromLat};{$toLng},{$toLat}",
                ['overview' => 'full', 'geometries' => 'polyline']
            );

            if (!$response->successful()) {
                return $fallback;
            }

            $route = $response->json('routes.0');

            if (!$route) {
                return $fallback;
            }

            return [
                'distance_km' => round($route['distance'] / 1000, 2),
                'eta_minutes' => (int) ceil($route['duration'] / 60),
                'geometry' => $route['geometry'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::warning('OSRM routing unavailable: ' . $e->getMessage());
            return $fallback;
        }
    }

        private function straightLineEstimate(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $distance = $this->distanceKm($fromLat, $fromLng, $toLat, $toLng);

        return [
            'distance_km' => round($distance, 2),
            'eta_minutes' => (int) max(1, ceil(($distance / self::ASSUMED_SPEED_KMH) * 60)),
            'geometry' => null,
        ];
    }
}
