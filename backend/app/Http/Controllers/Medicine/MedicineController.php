<?php

namespace App\Http\Controllers\Medicine;

use App\Http\Controllers\Controller;
use App\Http\Requests\Medicine\RegisterMedicineRequest;
use App\Http\Requests\Medicine\UpdateMedicineRequest;
use App\Models\Medicine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MedicineController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    private function imageHandler(Request $request, array &$validated, ?Medicine $medicine = null): void
    {
        if ($request->hasFile('image_url')) {
            if ($medicine && $medicine->image_url) {
                $this->deleteOldImage($medicine->image_url);
            }
            $path = $request->file('image_url')->store('medicine_images', 'public');
            $validated['image_url'] = Storage::url($path);
        } else if (array_key_exists('image_url', $validated) && is_null($validated['image_url'])) {
            // If remove Image button is pressed we will send image_url null
            // otherwise the key won't be sent
            if ($medicine && $medicine->image_url) {
                $this->deleteOldImage($medicine->image_url);
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

    /**
     * @OA\Get(
     * path="/api/medicines",
     * summary="List all medicines with optional filters and sorting",
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="category_id",
     * in="query",
     * required=false,
     * @OA\Schema(type="integer"),
     * description="Filter medicines by category ID."
     * ),
     * @OA\Parameter(
     * name="page",
     * in="query",
     * description="Page number for pagination",
     * required=false,
     * @OA\Schema(type="integer", default=1)
     * ),
     * @OA\Parameter(
     * name="name",
     * in="query",
     * required=false,
     * @OA\Schema(type="string"),
     * description="Search medicines by name (partial match)."
     * ),
     * @OA\Parameter(
     * name="sort_by",
     * in="query",
     * required=false,
     * @OA\Schema(type="string", enum={"price"}),
     * description="Field to sort by."
     * ),
     * @OA\Parameter(
     * name="sort_order",
     * in="query",
     * required=false,
     * @OA\Schema(type="string", enum={"asc", "desc"}),
     * description="Sort order."
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/MedicinePagination")
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Medicine::query();

            if ($request->has('category')) {
                $categoryName = $request->input('category');
                $query->whereHas('categories', function ($q) use ($categoryName) {
                    $q->where('categories.name', $categoryName);
                });
            }

            if ($request->has('name')) {
                $name = $request->input('name');
                $query->where('name', 'like', '%' . $name . '%');
            }

             if ($request->has('sort_by_price')) {
                $sortOrder = $request->input('sort_by_price', 'asc');
                $query->orderBy('price', $sortOrder);
            }

            if ($request->has('is_available')) {
                $isAvailable = $request->input('is_available');
                if ($isAvailable === 'true') {
                    $query->where('stock', '>', 0);
                } else {
                    $query->where('stock', 0);
                }
            }

            $medicines = $query->paginate(10);

            return response()->json($medicines, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/medicines/{medicine}",
     * summary="Retrieve a single medicine with its categories",
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="medicine",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="The ID of the medicine to retrieve."
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/Medicine")
     * ),
     * @OA\Response(
     * response=404,
     * description="Medicine not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $medicine): JsonResponse
    {
        try {
            $foundMedicine = Medicine::with('categories')->find($medicine);

            if (!$foundMedicine) {
                return response()->json([
                    'errors' => 'Medicine not found',
                ], 404);
            }

            return response()->json($foundMedicine, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/medicines",
     * summary="Create a new medicine",
     * security={{"sanctum":{}}},
     * tags={"Medicines"},
     * @OA\RequestBody(
     * required=true,
     * @OA\MediaType(
     * mediaType="multipart/form-data",
     * @OA\Schema(
     * @OA\Property(property="name", type="string", example="Paracetamol"),
     * @OA\Property(property="description", type="string", nullable=true, example="Description of Paracetamol"),
     * @OA\Property(property="price", type="number", format="float", example="10.99"),
     * @OA\Property(property="dosage", type="string", example="500mg"),
     * @OA\Property(property="brand", type="string", example="Pfizer"),
     * @OA\Property(property="stock", type="integer", example="10"),
     * @OA\Property(property="image_url", type="string", format="binary", nullable=true, description="Medicine image file"),
     * @OA\Property(property="category_ids[]", type="array", @OA\Items(type="integer"), description="Array of category IDs"),
     * required={"name", "price", "dosage", "brand", "stock", "category_ids[]"}
     * )
     * ),
     * @OA\MediaType(
     * mediaType="application/json",
     * @OA\Schema(
     * @OA\Property(property="name", type="string", example="Paracetamol"),
     * @OA\Property(property="description", type="string", nullable=true, example="Description of Paracetamol"),
     * @OA\Property(property="price", type="number", format="float", example="10.99"),
     * @OA\Property(property="dosage", type="string", example="500mg"),
     * @OA\Property(property="brand", type="string", example="Pfizer"),
     * @OA\Property(property="stock", type="integer", example="10"),
     * @OA\Property(property="image_url", type="string", nullable=true, description="URL of the medicine image"),
     * @OA\Property(property="category_ids", type="array", @OA\Items(type="integer"), description="Array of category IDs"),
     * required={"name", "price", "dosage", "brand", "stock", "category_ids"}
     * )
     * )
     * ),
     * @OA\Response(
     * response=201,
     * description="Medicine created successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Medicine created successfully")
     * )
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function create(RegisterMedicineRequest $request): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'errors' => 'You are not authorized to create a medicine.',
            ], 403);
        }

        $validated = $request->validated();
        
        $this->imageHandler($request, $validated);

        $categoryIds = $validated['category_ids'];
        unset($validated['category_ids']);

        try {
            $medicine = Medicine::create($validated);
            $medicine->categories()->attach($categoryIds);

            return response()->json([
                'success' => 'Medicine created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/medicines/{medicine}",
     * summary="Update an existing medicine",
     * description="Uses POST method with _method=PATCH for multipart/form-data support.",
     * security={{"sanctum":{}}},
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="medicine",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="The ID of the medicine to update."
     * ),
     * @OA\RequestBody(
     * required=true,
     * @OA\MediaType(
     * mediaType="multipart/form-data",
     * @OA\Schema(
     * @OA\Property(property="_method", type="string", enum={"PATCH"}, description="Method override for multipart/form-data"),
     * @OA\Property(property="name", type="string", example="Napa"),
     * @OA\Property(property="description", type="string", nullable=true, example="Updated Description of Paracetamol"),
     * @OA\Property(property="price", type="number", format="float", example="7.99"),
     * @OA\Property(property="dosage", type="string", example="70mg"),
     * @OA\Property(property="brand", type="string", example="Moderna"),
     * @OA\Property(property="stock", type="integer", example="10"),
     * @OA\Property(property="image_url", type="string", format="binary", nullable=true, description="New image file. Send a file to update, or null to remove."),
     * @OA\Property(property="category_ids[]", type="array", @OA\Items(type="integer"), description="Array of category IDs"),
     * )
     * ),
     * @OA\MediaType(
     * mediaType="application/json",
     * @OA\Schema(
     * @OA\Property(property="name", type="string", example="Napa"),
     * @OA\Property(property="description", type="string", nullable=true, example="Updated Description of Paracetamol"),
     * @OA\Property(property="price", type="number", format="float", example="7.99"),
     * @OA\Property(property="dosage", type="string", example="70mg"),
     * @OA\Property(property="brand", type="string", example="Moderna"),
     * @OA\Property(property="stock", type="integer", example="10"),
     * @OA\Property(property="image_url", type="string", nullable=true, description="URL of the medicine image. Set to null to remove."),
     * @OA\Property(property="category_ids", type="array", @OA\Items(type="integer"), description="Array of category IDs"),
     * )
     * )
     * ),
     * @OA\Response(
     * response=200,
     * description="Medicine updated successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Medicine updated successfully")
     * )
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Medicine not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function update(UpdateMedicineRequest $request, string $medicine): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'error' => 'You are not authorized to update this medicine.',
            ], 403);
        }

        $validated = $request->validated();
        
        try {
            $foundMedicine = Medicine::find($medicine);

            if (!$foundMedicine) {
                return response()->json([
                    'errors' => 'Medicine not found',
                ], 404);
            }

            $this->imageHandler($request, $validated, $foundMedicine);
            
            $categoryIds = $validated['category_ids'] ?? [];
            unset($validated['category_ids']);

            $foundMedicine->update($validated);
            $foundMedicine->categories()->sync($categoryIds);

            return response()->json([
                'success' => 'Medicine updated successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/medicines/{medicine}",
     * summary="Delete a medicine",
     * security={{"sanctum":{}}},
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="medicine",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="The ID of the medicine to delete."
     * ),
     * @OA\Response(
     * response=204,
     * description="Medicine deleted successfully. No content returned."
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Medicine not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(Request $request, string $medicine): JsonResponse
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'errors' => 'You are not authorized to delete this medicine.',
            ], 403);
        }

        try {
            $foundMedicine = Medicine::find($medicine);

            if (!$foundMedicine) {
                return response()->json([
                    'errors' => 'Medicine not found',
                ], 404);
            }

            $this->deleteOldImage($foundMedicine->image_url);

            $foundMedicine->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
}