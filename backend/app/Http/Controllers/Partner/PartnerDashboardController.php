<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\AmbulanceCompany;
use App\Models\EquipmentRental;
use App\Models\AmbulanceVehicle;
use App\Models\AmbulanceTrip;
use App\Models\VendorReview;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PartnerDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function vendorDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $vendor = null;

            // Admin / Super Admin can view any vendor dashboard
            if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('vendor_id')) {
                $vendor = Vendor::find($request->vendor_id);
            } else if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('user_id')) {
                $vendor = Vendor::where('user_id', $request->user_id)->first();
            } else {
                // Otherwise retrieve the vendor profile of the logged-in user
                $vendor = Vendor::where('user_id', $user->id)->first();
            }

            // Fallback for admin if no vendor selected
            if (!$vendor && ($user->isAdmin() || $user->isSuperAdmin())) {
                $vendor = Vendor::first();
            }

            if (!$vendor) {
                return response()->json(['errors' => 'Authorized vendor profile not found.'], 403);
            }

            // 1. Live asset usage
            $equipmentList = $vendor->equipment()->get();
            $assetUsage = $equipmentList->map(function ($item) {
                $rentedCount = EquipmentRental::where('equipment_id', $item->id)
                    ->where('status', 'active')
                    ->count();

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category,
                    'total_quantity' => $item->quantity,
                    'rented_quantity' => $rentedCount,
                    'available_quantity' => max(0, $item->quantity - $rentedCount),
                ];
            });

            // 2. Active rentals
            $activeRentals = EquipmentRental::with(['user', 'equipment'])
                ->where('vendor_id', $vendor->id)
                ->where('status', 'active')
                ->orderBy('rental_start', 'desc')
                ->get()
                ->map(function ($rental) {
                    return [
                        'id' => $rental->id,
                        'equipment_name' => $rental->equipment->name ?? 'Unknown',
                        'customer_name' => trim(($rental->user->first_name ?? '') . ' ' . ($rental->user->last_name ?? '')),
                        'customer_email' => $rental->user->email ?? 'N/A',
                        'rental_start' => $rental->rental_start,
                        'rental_end' => $rental->rental_end,
                        'total_price' => $rental->total_price,
                    ];
                });

            // 3. Upcoming income projections (sum of active/future rentals)
            $incomeProjections = EquipmentRental::where('vendor_id', $vendor->id)
                ->whereIn('status', ['active'])
                ->sum('total_price');

            // 4. Average review rating
            $avgRating = VendorReview::where('vendor_id', $vendor->id)->avg('rating') ?: 0.0;
            $reviewsCount = VendorReview::where('vendor_id', $vendor->id)->count();

            return response()->json([
                'vendor_info' => [
                    'id' => $vendor->id,
                    'company_name' => $vendor->company_name,
                    'license_num' => $vendor->license_num,
                    'description' => $vendor->description,
                ],
                'asset_usage' => $assetUsage,
                'active_rentals' => $activeRentals,
                'upcoming_projections' => (float)$incomeProjections,
                'average_rating' => round((float)$avgRating, 1),
                'reviews_count' => $reviewsCount,
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function ambulanceDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $company = null;

            // Admin / Super Admin can view any ambulance dashboard
            if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('ambulance_company_id')) {
                $company = AmbulanceCompany::find($request->ambulance_company_id);
            } else if (($user->isAdmin() || $user->isSuperAdmin()) && $request->filled('user_id')) {
                $company = AmbulanceCompany::where('user_id', $request->user_id)->first();
            } else {
                $company = AmbulanceCompany::where('user_id', $user->id)->first();
            }

            // Fallback for admin if no company selected
            if (!$company && ($user->isAdmin() || $user->isSuperAdmin())) {
                $company = AmbulanceCompany::first();
            }

            if (!$company) {
                return response()->json(['errors' => 'Authorized ambulance company profile not found.'], 403);
            }

            // 1. Completed trips count/list
            $tripsQuery = AmbulanceTrip::with('vehicle')
                ->where('ambulance_company_id', $company->id)
                ->orderBy('completion_time', 'desc');

            $completedTripsCount = $tripsQuery->count();
            $tripsList = $tripsQuery->get();

            // 2. Average response delay
            $avgDelay = AmbulanceTrip::where('ambulance_company_id', $company->id)
                ->avg('response_delay_minutes') ?: 0.0;

            // 3. Total revenue
            $totalRevenue = AmbulanceTrip::where('ambulance_company_id', $company->id)
                ->sum('revenue') ?: 0.0;

            // 4. Individual vehicle efficiency
            $vehicles = AmbulanceVehicle::where('ambulance_company_id', $company->id)->get();
            $vehicleEfficiency = $vehicles->map(function ($vehicle) {
                $vTrips = AmbulanceTrip::where('vehicle_id', $vehicle->id)->get();
                $vTripsCount = $vTrips->count();
                $vAvgDelay = $vTrips->avg('response_delay_minutes') ?: 0.0;
                $vRevenue = $vTrips->sum('revenue') ?: 0.0;

                return [
                    'id' => $vehicle->id,
                    'vehicle_number' => $vehicle->vehicle_number,
                    'model' => $vehicle->model,
                    'status' => $vehicle->status,
                    'trips_count' => $vTripsCount,
                    'average_response_delay' => round($vAvgDelay, 1),
                    'total_revenue' => (float)$vRevenue,
                ];
            });

            return response()->json([
                'company_info' => [
                    'id' => $company->id,
                    'company_name' => $company->company_name,
                    'license_num' => $company->license_num,
                    'description' => $company->description,
                ],
                'completed_trips_count' => $completedTripsCount,
                'completed_trips' => $tripsList,
                'average_response_delay' => round((float)$avgDelay, 1),
                'total_revenue' => (float)$totalRevenue,
                'vehicle_efficiency' => $vehicleEfficiency,
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }
}
