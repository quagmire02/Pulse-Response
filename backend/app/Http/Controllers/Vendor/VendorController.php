<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\RegisterVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class VendorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Vendor::query();

            if ($request->has('name')) {
                $query->where('name', 'like', '%' . $request->input('name') . '%');
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            return response()->json($query->paginate(10), 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $vendor = Vendor::find($id);

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found'], 404);
            }

            return response()->json($vendor, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function create(RegisterVendorRequest $request): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to create a vendor.'], 403);
        }

        try {
            Vendor::create($request->validated());
            return response()->json(['success' => 'Vendor created successfully'], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function update(UpdateVendorRequest $request, string $id): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to update this vendor.'], 403);
        }

        try {
            $vendor = Vendor::find($id);

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found'], 404);
            }

            $vendor->update($request->validated());
            return response()->json(['success' => 'Vendor updated successfully'], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to delete this vendor.'], 403);
        }

        try {
            $vendor = Vendor::find($id);

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found'], 404);
            }

            $vendor->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }
}
