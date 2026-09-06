<?php

namespace App\Http\Controllers\Medicine;

use App\Http\Controllers\Controller;
use App\Http\Requests\Medicine\RegisterMedicineRequest;
use App\Http\Requests\Medicine\UpdateMedicineRequest;
use App\Models\Medicine;
use App\Services\RestockNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MedicineController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show', 'suggestions', 'alternatives']);
    }

    /**
     * Who may manage the medicine catalogue.
     *
     * Pharmacists own the medicine catalogue the same way vendors own the
     * equipment catalogue; admins can also step in.
     */
    private function canManageCatalogue(): bool
    {
        $user = Auth::user();

        // Checks for a real pharmacist profile rather than the role string, so
        // a doctor cannot edit the catalogue even if their role is mislabelled.
        return $user->isAdmin()
            || $user->isSuperAdmin()
            || $user->isPharmacist();
    }

    /**
     * Whether this account may change a specific listing.
     *
     * Admins can touch anything. A pharmacist owns what they listed, plus the
     * unowned rows that predate the ownership column, so an existing catalogue
     * does not become uneditable the moment the migration runs.
     */
    private function canManageMedicine(Medicine $medicine): bool
    {
        $user = Auth::user();

        if ($user->isAdmin() || $user->isSuperAdmin()) {
            return true;
        }

        $profileId = $user->pharmacistProfile?->id;

        if (!$profileId) {
            return false;
        }

        return $medicine->pharmacist_id === null
            || (int) $medicine->pharmacist_id === (int) $profileId;
    }

    /**
     * @OA\Get(
     * path="/api/medicines/suggestions",
     * summary="Typeahead suggestions for the medicine search bar",
     * description="Returns a short list of matches as soon as the shopper has typed a
     * character or two. Names that start with the term are ranked above ones that merely contain it.",
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="q",
     * in="query",
     * required=true,
     * @OA\Schema(type="string"),
     * description="Partial search term, e.g. 'na'."
     * ),
     * @OA\Parameter(
     * name="limit",
     * in="query",
     * required=false,
     * @OA\Schema(type="integer", default=8),
     * description="Maximum number of suggestions to return (capped at 20)."
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Medicine"))
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
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

            $medicines = Medicine::query()
                ->select('id', 'name', 'generic_name', 'brand', 'dosage', 'price', 'stock', 'image_url')
                ->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', [$term . '%'])
                      ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $term . '%'])
                      ->orWhereRaw('LOWER(generic_name) LIKE ?', ['%' . $term . '%'])
                      ->orWhereRaw('LOWER(brand) LIKE ?', ['%' . $term . '%']);
                })
                // Prefix matches first, then in-stock items, then alphabetically.
                ->orderByRaw('CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END', [$term . '%'])
                ->orderByRaw('CASE WHEN stock > 0 THEN 0 ELSE 1 END')
                ->orderBy('name')
                ->limit($limit)
                ->get();

            return response()->json(['data' => $medicines], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/medicines/alternatives",
     * summary="Recommend in-stock medicines sharing the same chemical (generic) name",
     * description="Given either a medicine id or a raw search term, this finds the chemical name(s)
     * behind the match (e.g. 'Napa' -> 'Paracetamol') and returns other in-stock medicines built on
     * the same chemical. Falls back to shared categories when no generic name is recorded.",
     * tags={"Medicines"},
     * @OA\Parameter(
     * name="medicine_id",
     * in="query",
     * required=false,
     * @OA\Schema(type="integer"),
     * description="Look up alternatives for this specific medicine."
     * ),
     * @OA\Parameter(
     * name="name",
     * in="query",
     * required=false,
     * @OA\Schema(type="string"),
     * description="Look up alternatives for whatever the shopper searched for."
     * ),
     * @OA\Parameter(
     * name="limit",
     * in="query",
     * required=false,
     * @OA\Schema(type="integer", default=8)
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * @OA\Property(property="generic_names", type="array", @OA\Items(type="string")),
     * @OA\Property(property="matched_by", type="string", enum={"generic_name", "category", "none"}),
     * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Medicine"))
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function alternatives(Request $request): JsonResponse
    {
        try {
            $limit = min((int) $request->input('limit', 8), 20);
            $medicineId = $request->input('medicine_id');
            $name = trim((string) $request->input('name', ''));

            // 'requested' echoes back what the shopper was actually after, so the
            // frontend can offer a restock request for a sold out item that the
            // in-stock-only listing filter has already hidden from the grid.
            $empty = ['generic_names' => [], 'matched_by' => 'none', 'data' => [], 'requested' => []];

            // Work out which medicines the shopper was actually after.
            $matches = collect();

            if ($medicineId) {
                $matches = Medicine::with('categories:id')->where('id', $medicineId)->get();
            } elseif ($name !== '') {
                $lowered = mb_strtolower($name);
                $matches = Medicine::with('categories:id')
                    ->where(function ($q) use ($lowered) {
                        $q->whereRaw('LOWER(name) LIKE ?', ['%' . $lowered . '%'])
                          ->orWhereRaw('LOWER(brand) LIKE ?', ['%' . $lowered . '%'])
                          ->orWhereRaw('LOWER(generic_name) LIKE ?', ['%' . $lowered . '%']);
                    })
                    ->limit(10)
                    ->get();
            }

            if ($matches->isEmpty()) {
                return response()->json($empty, 200);
            }

            $matchedIds = $matches->pluck('id')->all();
            $requested = $matches->map(fn ($medicine) => [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'generic_name' => $medicine->generic_name,
                'brand' => $medicine->brand,
                'stock' => $medicine->stock,
            ])->values();

            $genericNames = $matches->pluck('generic_name')
                ->filter(fn ($generic) => filled($generic))
                ->map(fn ($generic) => mb_strtolower(trim($generic)))
                ->unique()
                ->values();

            // Same chemical, different brand, and actually in stock.
            if ($genericNames->isNotEmpty()) {
                $query = Medicine::query()
                    ->whereNotIn('id', $matchedIds)
                    ->where('stock', '>', 0)
                    ->where(function ($q) use ($genericNames) {
                        foreach ($genericNames as $generic) {
                            $q->orWhereRaw('LOWER(generic_name) = ?', [$generic]);
                        }
                    });

                $alternatives = $query->orderBy('price')->limit($limit)->get();

                if ($alternatives->isNotEmpty()) {
                    return response()->json([
                        'generic_names' => $matches->pluck('generic_name')->filter()->unique()->values(),
                        'matched_by' => 'generic_name',
                        'data' => $alternatives,
                        'requested' => $requested,
                    ], 200);
                }
            }

            // Nothing shares the chemical, so fall back to the same category.
            $categoryIds = $matches->flatMap(fn ($medicine) => $medicine->categories->pluck('id'))
                ->unique()
                ->values();

            if ($categoryIds->isNotEmpty()) {
                $alternatives = Medicine::query()
                    ->whereNotIn('id', $matchedIds)
                    ->where('stock', '>', 0)
                    ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds))
                    ->orderBy('price')
                    ->limit($limit)
                    ->get();

                if ($alternatives->isNotEmpty()) {
                    return response()->json([
                        'generic_names' => $matches->pluck('generic_name')->filter()->unique()->values(),
                        'matched_by' => 'category',
                        'data' => $alternatives,
                        'requested' => $requested,
                    ], 200);
                }
            }

            // Genuine dead end. The caller still gets what was searched for, so
            // it can offer to notify the pharmacy instead of showing nothing.
            return response()->json(array_merge($empty, ['requested' => $requested]), 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generic fallback for a sold out medicine: push the demand to the pharmacy
     * team so someone can restock it.
     *
     * Reached from the shopper facing "nothing to recommend" panel, which is the
     * only place the alternatives search can end without a suggestion.
     */
    public function requestRestock(string $id, RestockNotifier $notifier): JsonResponse
    {
        try {
            $medicine = Medicine::find($id);

            if (!$medicine) {
                return response()->json(['errors' => 'Medicine not found.'], 404);
            }

            if ($medicine->stock > 0) {
                return response()->json(['errors' => 'This medicine is back in stock.'], 409);
            }

            $result = $notifier->medicineOutOfStock($medicine, Auth::user());

            return response()->json([
                'success' => $result['throttled']
                    ? 'The pharmacy has already been told about this one.'
                    : 'The pharmacy team has been notified. You will get a notification when it is back.',
                'notified' => $result['notified'],
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
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

            // Manage Medicines sends mine=1 so a pharmacist works on their own
            // shelf instead of scrolling the whole platform catalogue and
            // hitting a 403 on the first edit they try.
            if ($request->boolean('mine') && Auth::check()) {
                $user = Auth::user();

                // Admins manage everything, so the filter is a no-op for them.
                if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                    $profileId = $user->pharmacistProfile?->id;

                    // Unowned rows are included because they predate ownership
                    // and are still this pharmacist's to edit.
                    $query->where(function ($q) use ($profileId) {
                        $q->where('pharmacist_id', $profileId)
                          ->orWhereNull('pharmacist_id');
                    });
                }
            }

            if ($request->has('category') && $request->input('category') !== '') {
                $categoryName = $request->input('category');
                $query->whereHas('categories', function ($q) use ($categoryName) {
                    $q->where('categories.name', $categoryName);
                });
            }

            if ($request->has('name') && $request->input('name') !== '') {
                $name = mb_strtolower($request->input('name'));
                $query->where(function ($q) use ($name) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%' . $name . '%'])
                      ->orWhereRaw('LOWER(brand) LIKE ?', ['%' . $name . '%'])
                      ->orWhereRaw('LOWER(generic_name) LIKE ?', ['%' . $name . '%'])
                      ->orWhereRaw('LOWER(dosage) LIKE ?', ['%' . $name . '%'])
                      ->orWhereHas('categories', function ($catQ) use ($name) {
                          $catQ->whereRaw('LOWER(name) LIKE ?', ['%' . $name . '%']);
                      });
                });
            }

            if ($request->has('sort_by_price') && $request->input('sort_by_price') !== '') {
                $sortOrder = $request->input('sort_by_price', 'asc');
                $query->orderBy('price', $sortOrder);
            }

            if ($request->has('is_available') && $request->input('is_available') !== '') {
                $isAvailable = $request->input('is_available');
                if ($isAvailable === 'true') {
                    $query->where('stock', '>', 0);
                } elseif ($isAvailable === 'false') {
                    $query->where('stock', 0);
                }
            }

            $perPage = $request->input('per_page', 10);
            $medicines = $query->paginate($perPage);

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
        if (!$this->canManageCatalogue()) {
            return response()->json([
                'errors' => 'You are not authorized to create a medicine.',
            ], 403);
        }

        $validated = $request->validated();
        
        $this->imageHandler($request, $validated);

        $categoryIds = $validated['category_ids'];
        unset($validated['category_ids']);

        try {
            // Stamp the owner so this listing shows up in that pharmacist's
            // sales figures and nobody else's. Admin created rows stay
            // unowned, which is what null means here.
            $validated['pharmacist_id'] = Auth::user()->pharmacistProfile?->id;

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
        if (!$this->canManageCatalogue()) {
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

            if (!$this->canManageMedicine($foundMedicine)) {
                return response()->json([
                    'errors' => 'This medicine belongs to another pharmacy.',
                ], 403);
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
        if (!$this->canManageCatalogue()) {
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

            if (!$this->canManageMedicine($foundMedicine)) {
                return response()->json([
                    'errors' => 'This medicine belongs to another pharmacy.',
                ], 403);
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