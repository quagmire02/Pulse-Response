<?php

namespace App\Http\Controllers\Equipment;

use App\Http\Controllers\Controller;
use App\Http\Requests\Equipment\RegisterEquipmentRequest;
use App\Http\Requests\Equipment\UpdateEquipmentRequest;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class EquipmentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    private function imageHandler(Request $request, array &$validated, ?Equipment $equipment = null): void
    {
        if ($request->hasFile('image_url')) {
            if ($equipment && $equipment->image_url) {
                $this->deleteOldImage($equipment->image_url);
            }
            $path = $request->file('image_url')->store('equipment_images', 'public');
            $validated['image_url'] = Storage::url($path);
        } elseif (array_key_exists('image_url', $validated) && is_null($validated['image_url'])) {
            if ($equipment && $equipment->image_url) {
                $this->deleteOldImage($equipment->image_url);
            }
            $validated['image_url'] = null;
        } else {
            unset($validated['image_url']);
        }
    }

    private function deleteOldImage(?string $imageUrl): void
    {
        if ($imageUrl) {
            $path = str_replace(Storage::url(''), '', $imageUrl);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Equipment::query();

            if ($request->has('name')) {
                $query->where('name', 'like', '%' . $request->input('name') . '%');
            }

            if ($request->has('rental_status')) {
                $query->where('rental_status', $request->input('rental_status'));
            }

            if ($request->has('sort_by') && $request->input('sort_by') === 'price') {
                $query->orderBy('price', $request->input('sort_order', 'asc'));
            }

            return response()->json($query->paginate(10), 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function show(string $equipment): JsonResponse
    {
        try {
            $found = Equipment::find($equipment);

            if (!$found) {
                return response()->json(['errors' => 'Equipment not found'], 404);
            }

            return response()->json($found, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function create(RegisterEquipmentRequest $request): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to create equipment.'], 403);
        }

        $validated = $request->validated();
        $this->imageHandler($request, $validated);

        try {
            Equipment::create($validated);
            return response()->json(['success' => 'Equipment created successfully'], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function update(UpdateEquipmentRequest $request, string $equipment): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to update this equipment.'], 403);
        }

        try {
            $found = Equipment::find($equipment);

            if (!$found) {
                return response()->json(['errors' => 'Equipment not found'], 404);
            }

            $validated = $request->validated();
            $this->imageHandler($request, $validated, $found);
            $found->update($validated);

            return response()->json(['success' => 'Equipment updated successfully'], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $equipment): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'You are not authorized to delete this equipment.'], 403);
        }

        try {
            $found = Equipment::find($equipment);

            if (!$found) {
                return response()->json(['errors' => 'Equipment not found'], 404);
            }

            $this->deleteOldImage($found->image_url);
            $found->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => $e->getMessage()], 500);
        }
    }
}
