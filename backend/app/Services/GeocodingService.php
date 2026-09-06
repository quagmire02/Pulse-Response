<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    private const URL = 'https://nominatim.openstreetmap.org/reverse';

        private const CACHE_MINUTES = 60 * 24;

        public function reverse(float $lat, float $lng): ?string
    {
        $key = 'geocode:' . round($lat, 4) . ',' . round($lng, 4);

        return Cache::remember($key, now()->addMinutes(self::CACHE_MINUTES), function () use ($lat, $lng) {
            try {
                $response = Http::withHeaders([
                        'User-Agent' => 'PulseResponse/1.0 (university project)',
                    ])
                    ->timeout(8)
                    ->get(self::URL, [
                        'format' => 'jsonv2',
                        'lat' => $lat,
                        'lon' => $lng,
                        'zoom' => 18,
                        'addressdetails' => 1,
                    ]);

                if (!$response->successful()) {
                    Log::warning('Reverse geocode failed: HTTP ' . $response->status());
                    return null;
                }

                return $this->shortAddress($response->json('address') ?? [])
                    ?? $response->json('display_name');
            } catch (\Exception $e) {
                Log::warning('Reverse geocode unreachable: ' . $e->getMessage());
                return null;
            }
        });
    }

        private function shortAddress(array $address): ?string
    {
        $parts = [];

        foreach (['neighbourhood', 'suburb', 'quarter', 'residential', 'road'] as $key) {
            if (!empty($address[$key])) {
                $parts[] = $address[$key];
                break;
            }
        }

        foreach (['city_district', 'borough', 'suburb'] as $key) {
            if (!empty($address[$key]) && !in_array($address[$key], $parts, true)) {
                $parts[] = $address[$key];
                break;
            }
        }

        foreach (['city', 'town', 'village', 'state_district'] as $key) {
            if (!empty($address[$key]) && !in_array($address[$key], $parts, true)) {
                $parts[] = $address[$key];
                break;
            }
        }

        return empty($parts) ? null : implode(', ', $parts);
    }
}
