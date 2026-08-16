<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AmbulanceCompanyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function show(string $userId): JsonResponse
    {
        try {
            $company = AmbulanceCompany::with('user')->where('user_id', $userId)->first();

            if (!$company) {
                return response()->json(["errors" => "Ambulance company profile not found."], 404);
            }

            return response()->json($company, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                "errors" => "An unexpected error occurred."
            ], 500);
        }
    }
}
