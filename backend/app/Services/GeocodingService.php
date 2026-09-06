<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Turns coordinates into a human readable address using Nominatim, the
 * OpenStreetMap geocoder. Free and keyless, same as the routing service.
 *
 * Called from the server rather than the browser for two reasons: Nominatim
 * requires an identifying User-Agent, and calling it client side would leak a
 * user's exact position to a third party on every GPS tick.
 */
class GeocodingService
{
    private const URL = 'https://nominatim.openstreetmap.org/reverse';

    /** Nominatim asks for max one request per second, so results are cached. */
    private const CACHE_MINUTES = 60 * 24;

    /**
     * A short address like "Niketan, Gulshan 1, Dhaka", or null if lookup fails.
     */
    public function reverse(float $lat, float $lng): ?string
    {
        // Round to ~11 m so small GPS jitter reuses the same cache entry
        // instead of hammering the service on every ping.
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

    /**
     * Nominatim returns a long comma separated string including the country and
     * postcode. Build something closer to how people actually say an address.
     *
     * @param array<string, mixed> $address
     */
    private function shortAddress(array $address): ?string
    {
        $parts = [];

        // Most specific recognisable place first.
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
