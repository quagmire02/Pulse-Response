<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class GeocodeController extends Controller
{
    public function __construct(private GeocodingService $geocoding)
    {
        $this->middleware('auth:sanctum');
    }

        public function reverse(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'lat' => ['required', 'numeric', 'between:-90,90'],
                'lng' => ['required', 'numeric', 'between:-180,180'],
            ]);

            return response()->json([
                'address' => $this->geocoding->reverse(
                    (float) $validated['lat'],
                    (float) $validated['lng']
                ),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['address' => null], 200);
        }
    }
}
