<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\AmbulanceCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AmbulanceCompanyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

        public function index(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['errors' => 'You are not authorized to view all companies.'], 403);
            }

            $companies = AmbulanceCompany::with('user:id,username,email')
                ->withCount('vehicles')
                ->orderBy('company_name')
                ->get();

            return response()->json(['data' => $companies], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
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
