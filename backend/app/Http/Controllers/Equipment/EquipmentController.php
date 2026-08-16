<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Equipment\RegisterEquipmentRequest;
use App\Http\Requests\Equipment\UpdateEquipmentRequest;
use App\Models\Equipment;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EquipmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Equipment::with('vendor.user');

            if ($request->filled('search')) {
                $query->search($request->search);
            }

            if ($request->filled('category')) {
                $query->filterByCategory($request->category);
            }

            if ($request->filled('condition')) {
                $query->filterByCondition($request->condition);
            }

            if ($request->boolean('available_only')) {
                $query->availableOnly();
            }

            if ($request->filled('min_price')) {
                $query->where('price_per_day', '>=', $request->min_price);
            }

            if ($request->filled('max_price')) {
                $query->where('price_per_day', '<=', $request->max_price);
            }

            $perPage = $request->input('per_page', 10);
            $equipment = $query->paginate($perPage);
            return response()->json($equipment, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Typeahead suggestions for the equipment search bar. Kept deliberately small and
     * prefix-first so options appear after a character or two rather than a full name.
     */
    public function suggestions(Request $request): JsonResponse
    {
        try {
            $term = trim((string) $request->input('q', ''));

            if ($term === '') {
                return response()->json(['data' => []], 200);
            }

            $limit = min((int) $request->input('limit', 8), 20);
            $term = mb_strtolower($term);

            $equipment = Equipment::query()
                ->select('id', 'name', 'category', 'price_per_day', 'is_available', 'quantity', 'image')
                ->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', [$term . '%'])
                      ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $term . '%'])
                      ->orWhereRaw('LOWER(category) LIKE ?', ['%' . $term . '%']);
                })
                ->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END', [$term . '%'])
                ->orderByDesc('is_available')
                ->orderBy('name')
                ->limit($limit)
                ->get();

            return response()->json(['data' => $equipment], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $equipment = Equipment::with('vendor.user')->find($id);

            if (!$equipment) {
                return response()->json(['errors' => 'Equipment not found.'], 404);
            }

            return response()->json($equipment, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function create(RegisterEquipmentRequest $request): JsonResponse
    {
        $user = Auth::user();
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['errors' => 'Only vendors or admins can add equipment.'], 403);
        }

        // Admins can pass vendor_id explicitly, vendors use their own
        if ($user->isAdmin() || $user->isSuperAdmin()) {
            $vendorId = $request->input('vendor_id');
            if (!$vendorId) {
                return response()->json(['errors' => 'vendor_id is required for admins.'], 422);
            }
            $vendor = Vendor::find($vendorId);
            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found.'], 404);
            }
        }

        try {
            $validated = $request->validated();
            $validated['vendor_id'] = $vendor->id;

            if ($request->hasFile('image')) {
                $validated['image'] = $request->file('image')->store('equipment', 'public');
            }

            // Auto-update availability based on quantity
            if (isset($validated['quantity'])) {
                $validated['is_available'] = $validated['quantity'] > 0;
            }

            $equipment = Equipment::create($validated);

            return response()->json(['success' => 'Equipment created successfully.', 'data' => $equipment], 201);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function update(UpdateEquipmentRequest $request, string $id): JsonResponse
    {
        try {
            $equipment = Equipment::find($id);

            if (!$equipment) {
                return response()->json(['errors' => 'Equipment not found.'], 404);
            }

            $user = Auth::user();
            $vendor = Vendor::where('user_id', $user->id)->first();
            $isOwner = $vendor && $vendor->id === $equipment->vendor_id;

            if (!$isOwner && !$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['errors' => 'You are not authorized to update this equipment.'], 403);
            }

            $validated = $request->validated();

            if ($request->hasFile('image')) {
                if ($equipment->image) {
                    Storage::disk('public')->delete($equipment->image);
                }
                $validated['image'] = $request->file('image')->store('equipment', 'public');
            }

            // Auto-update availability based on quantity
            if (isset($validated['quantity'])) {
                $validated['is_available'] = $validated['quantity'] > 0;
            }

            $equipment->update($validated);

            return response()->json(['success' => 'Equipment updated successfully.', 'data' => $equipment], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $equipment = Equipment::find($id);

            if (!$equipment) {
                return response()->json(['errors' => 'Equipment not found.'], 404);
            }

            $user = Auth::user();
            $vendor = Vendor::where('user_id', $user->id)->first();
            $isOwner = $vendor && $vendor->id === $equipment->vendor_id;

            if (!$isOwner && !$user->isAdmin() && !$user->isSuperAdmin()) {
                return response()->json(['errors' => 'You are not authorized to delete this equipment.'], 403);
            }

            if ($equipment->image) {
                Storage::disk('public')->delete($equipment->image);
            }

            $equipment->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    // GET /vendors/{vendor}/equipment
    public function byVendor(string $vendorUserId): JsonResponse
    {
        try {
            $vendor = Vendor::where('user_id', $vendorUserId)->first();

            if (!$vendor) {
                return response()->json(['errors' => 'Vendor not found.'], 404);
            }

            $equipment = Equipment::with('vendor.user')
                ->where('vendor_id', $vendor->id)
                ->paginate(10);

            return response()->json($equipment, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }
}
