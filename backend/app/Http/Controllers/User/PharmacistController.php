<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\RegisterPharmacistRequest;
use App\Http\Requests\User\UpdatePharmacistRequest;
use App\Models\Pharmacist;
use App\Models\User;
use App\Models\Cart;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;


class PharmacistController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    
    /**
     * @OA\Get(
     * path="/api/pharmacists",
     * summary="Get a paginated list of all pharmacists",
     * tags={"Pharmacists"},
     * security={{"sanctum": {}}},
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/PharmacistWithUser")),
     * @OA\Property(property="links", type="object"),
     * @OA\Property(property="meta", type="object")
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function index(): JsonResponse
    {
        try {
            $pharmacists = Pharmacist::with('user')->paginate(10);
            return response()->json($pharmacists, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                "errors" => "An unexpected error occured"
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/pharmacists/{user}",
     * summary="Get a specific pharmacist by User ID",
     * tags={"Pharmacists"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user",
     * in="path",
     * required=true,
     * description="ID of the user associated with the pharmacist to retrieve",
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/PharmacistWithUser")
     * ),
     * @OA\Response(
     * response=404,
     * description="Pharmacist not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $user): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::with('user')->where('user_id', $user)->first();

            if (!$pharmacist) {
                return response()->json(["errors" => "Pharmacist not found."], 404);
            }

            return response()->json($pharmacist, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                "errors" => "An unexpected error occured"
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/pharmacists",
     * summary="Register a new pharmacist account",
     * tags={"Pharmacists"},
     * security={{"sanctum": {}}},
     * @OA\RequestBody(
     * required=true,
     * description="User and pharmacist data",
     * @OA\JsonContent(
     * ref="#/components/schemas/RegisterPharmacistRequest"
     * )
     * ),
     * @OA\Response(
     * response=201,
     * description="Pharmacist created successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Pharmacist profile created successfully.")
     * )
     * ),
     * @OA\Response(
     * response=400,
     * description="Bad Request",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function create(RegisterPharmacistRequest $request)
    {
        if (!Auth::user()->isSuperAdmin()) {
            return response()->json([
                "errors" => "You are not authorized to create a pharmacist account."
            ], 403);
        }

        try {
            $validated = $request->validated();

            $userData = [
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'username' => $validated['username'],
                'password' => $validated['password'],
            ];
            
            if (isset($validated['address'])) {
                $userData['address'] = $validated['address'];
            }

            $user = User::create($validated);

            $user->is_admin = true;
            $user->save();

            Cart::create([
                'user_id' => $user->id,
            ]);

            $pharmacistData = array_diff_key($validated, $userData);
            $pharmacistData['user_id'] = $user->id;
            Pharmacist::create($pharmacistData);

            return response()->json([
                "success" => "Pharmacist profile created successfully.",
            ], 201);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                "errors" => "An unexpected error occured"
            ], 500);
        }
    }

    /**
     * @OA\Patch(
     * path="/api/pharmacists/{user}",
     * summary="Update a pharmacist profile by User ID",
     * tags={"Pharmacists"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user",
     * in="path",
     * required=true,
     * description="ID of the user associated with the pharmacist to update",
     * @OA\Schema(type="integer")
     * ),
     * @OA\RequestBody(
     * required=true,
     * description="Updated user and pharmacist data",
     * @OA\JsonContent(
     * ref="#/components/schemas/UpdatePharmacistRequest"
     * )
     * ),
     * @OA\Response(
     * response=200,
     * description="Pharmacist updated successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Pharmacist profile updated successfully.")
     * )
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Pharmacist or User not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function update(UpdatePharmacistRequest $request, string $user): JsonResponse
    {
        try {
            $user = User::find($user);
            
            if (!$user) {
                 return response()->json(["errors" => "User not found."], 404);
            }

            $pharmacist = Pharmacist::where('user_id', $user->id)->first();

            if (!$pharmacist) {
                return response()->json(["errors" => "Pharmacist not found."], 404);
            }

            if (Auth::user()->id !== $pharmacist->user_id && !Auth::user()->isSuperAdmin()) {
                return response()->json(["errors" => "You are not authorized to update this pharmacist profile."], 403);
            }

            $validated = $request->validated();

            $userData = [
                'first_name' => isset($validated['first_name']) ? $validated['first_name'] : $user->first_name,
                'last_name' => isset($validated['last_name']) ? $validated['last_name'] : $user->last_name,
                'username' => isset($validated['username']) ? $validated['username'] : $user->username,
                'address' => isset($validated['address']) ? $validated['address'] : $user->address,
            ];

            if (isset($validated['password'])) {
                $user->password = $validated['password'];
            }

            $user->update($userData);

            $pharmacistData = array_diff_key($validated, $userData);
            $pharmacistData['user_id'] = $user->id;
            
            $pharmacist->update($pharmacistData);

            return response()->json([
                "success" => "Pharmacist profile updated successfully.",
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                "errors" => "An unexpected error occured"
            ], 500);
        }
    }
}