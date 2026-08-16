<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\RegisterVendorRequest;
use App\Http\Requests\User\UpdateVendorRequest;
use App\Models\Vendor;
use App\Models\User;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class VendorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Vendor::with('user');

            if ($request->filled('search')) {
                $query->search($request->search);
            }

            $vendors = $query->paginate(10);
            return response()->json($vendors, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function show(string $user): JsonResponse
    {
        try {
            $vendor = Vendor::with('user')->where('user_id', $user)->first();

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found.'], 404);
            }

            return response()->json($vendor, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function create(RegisterVendorRequest $request): JsonResponse
    {
        if (!Auth::user()->isAdmin() && !Auth::user()->isSuperAdmin()) {
            return response()->json(['errors' => 'You are not authorized to create a vendor account.'], 403);
        }

        try {
            $validated = $request->validated();

            $user = User::create($validated + ['role' => 'vendor']);

            // Cart::create(['user_id' => $user->id]);

            Vendor::create([
                'user_id'       => $user->id,
                'company_name'  => $validated['company_name'],
                'license_num'   => $validated['license_num'],
                'description'   => $validated['description'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
            ]);

            return response()->json(['success' => 'Vendor account created successfully.'], 201);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function update(UpdateVendorRequest $request, string $user): JsonResponse
    {
        try {
            $foundUser = User::find($user);

            if (!$foundUser) {
                return response()->json(['errors' => 'User not found.'], 404);
            }

            $vendor = Vendor::where('user_id', $foundUser->id)->first();

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found.'], 404);
            }

            if (Auth::user()->id !== $vendor->user_id && !Auth::user()->isSuperAdmin() && !Auth::user()->isAdmin()) {
                return response()->json(['errors' => 'You are not authorized to update this vendor.'], 403);
            }

            $validated = $request->validated();

            $userFields = ['first_name', 'last_name', 'username', 'address', 'email'];
            $userData = array_intersect_key($validated, array_flip($userFields));

            if (isset($validated['password'])) {
                $foundUser->password = $validated['password'];
            }

            if (!empty($userData)) {
                $foundUser->update($userData);
            }

            $vendorFields = ['company_name', 'license_num', 'description', 'contact_phone'];
            $vendorData = array_intersect_key($validated, array_flip($vendorFields));

            if (!empty($vendorData)) {
                $vendor->update($vendorData);
            }

            return response()->json(['success' => 'Vendor updated successfully.'], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }
}
