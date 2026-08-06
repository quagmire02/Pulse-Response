<?php

namespace App\Http\Controllers\User;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\User;
use App\Http\Requests\User\RegisterUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Traits\AuthenticateUser;
use App\OpenApi\Annotations as OA;

class UserController extends Controller
{
    use AuthenticateUser;

    /**
     * @OA\Get(
     * path="/api/users",
     * operationId="getUsersList",
     * tags={"Users"},
     * summary="Get a paginated list of all users",
     * description="Retrieves a paginated list of all registered users. Requires admin privileges.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="page",
     * in="query",
     * description="Page number for pagination",
     * required=false,
     * @OA\Schema(type="integer", default=1)
     * ),
     * @OA\Parameter(
     * name="per_page",
     * in="query",
     * description="Number of items per page",
     * required=false,
     * @OA\Schema(type="integer", default=10)
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/UserPagination")
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to view all users.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function index(): JsonResponse
    {
        $checkAuthUser = $this->ensureAuthenticated();

        if ($checkAuthUser) {
            return $checkAuthUser;
        }

        if (!Auth::user()->isAdmin()) {
            return response()->json([
                "errors" => "You are not authorized to view all users."
            ], 403);
        }

        try {
            $users = User::paginate(10);
            return response()->json($users, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/users/{user}",
     * operationId="getUserByIdOrSlug",
     * tags={"Users"},
     * summary="Get user details by ID or slug",
     * description="Retrieves the details of a specific user by their ID or slug.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user",
     * in="path",
     * description="ID or slug of the user to retrieve",
     * required=true,
     * @OA\Schema(type="string")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * allOf={
     * @OA\Schema(ref="#/components/schemas/User"),
     * }
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to view this user.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: User not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $user): JsonResponse
    {
        $checkAuthUser = $this->ensureAuthenticated();

        if ($checkAuthUser) {
            return $checkAuthUser;
        }

        try {
            $foundUser = User::where('id', $user)
                ->orWhere('slug', $user)
                ->first();

            if (!$foundUser) {
                return response()->json(['error' => 'User not found'], 404);
            }

            return response()->json($foundUser, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/users",
     * operationId="createUser",
     * tags={"Users"},
     * summary="Create a new user",
     * description="Registers a new user. Sensitive fields like 'is_admin' and 'is_active' 
     * cannot be set by the client for this endpoint.",
     * @OA\RequestBody(
     * required=true,
     * description="User registration data. Can be JSON or Multipart Form Data.",
     * @OA\MediaType(
     * mediaType="application/json",
     * @OA\Schema(
     * required={"email", "username", "password", "password_confirmation"},
     * @OA\Property(property="first_name", type="string", nullable=true, example="Jane"),
     * @OA\Property(property="last_name", type="string", nullable=true, example="Doe"),
     * @OA\Property(property="email", type="string", format="email", example="jane.doe@example.com"),
     * @OA\Property(property="username", type="string", example="janedoe"),
     * @OA\Property(property="password", type="string", format="password", example="Password123!"),
     * @OA\Property(property="password_confirmation", type="string", format="password", example="Password123!"),
     * @OA\Property(property="address", type="string", nullable=true, example="456 Business Ave"),
     * )
     * ),
     * ),
     * @OA\Response(
     * response=201,
     * description="User created successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Operation completed successfully.")
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Unauthorized key (e.g., is_admin, is_active, role) provided by client.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation Error: Invalid input for allowed fields.",
     * @OA\JsonContent(
     * @OA\Property(property="message", type="string", example="The given data was invalid."),
     * @OA\Property(property="errors", type="object",
     * @OA\AdditionalProperties(
     * type="array",
     * @OA\Items(type="string", example="The field is required.")
     * )
     * ),
     * example={
     * "message": "The given data was invalid.",
     * "errors": {
     * "email": {"The email is already in use."},
     * "password": {"The password confirmation does not match."}
     * }
     * }
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function createUser(RegisterUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated) {
                $user = User::create($validated);

                Cart::create([
                    'user_id' => $user->id,
                ]);
            });

            return response()->json([
                "success" => "User created successfully.",
            ], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Patch(
     * path="/api/users/{user}",
     * operationId="updateUser",
     * tags={"Users"},
     * summary="Update an existing user",
     * description="Updates the details of an existing user. A user can update their own profile, or a super admin can update any user's profile.
     * Sensitive fields like 'is_admin', 'is_active', and 'role' are ignored/discarded if sent in the request body, and 'password' is handled separately for updates.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user",
     * in="path",
     * description="ID or slug of the user to update",
     * required=true,
     * @OA\Schema(type="string")
     * ),
     * @OA\RequestBody(
     * required=true,
     * description="User data to update. Can be JSON or Multipart Form Data.",
     * @OA\MediaType(
     * mediaType="application/json",
     * @OA\Schema(
     * @OA\Property(property="first_name", type="string", nullable=true, example="Updated Name"),
     * @OA\Property(property="last_name", type="string", nullable=true, example="Updated Lastname"),
     * @OA\Property(property="username", type="string", nullable=true, example="updateduser"),
     * @OA\Property(property="address", type="string", nullable=true, example="789 New Address"),
     * )
     * ),
     * ),
     * @OA\Response(
     * response=200,
     * description="User updated successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="User updated successfully."),
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to update this user.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: User not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation Error: Invalid input for allowed fields.",
     * @OA\JsonContent(
     * @OA\Property(property="message", type="string", example="The given data was invalid."),
     * @OA\Property(property="errors", type="object",
     * @OA\AdditionalProperties(
     * type="array",
     * @OA\Items(type="string", example="The field is required.")
     * )
     * ),
     * example={
     * "message": "The given data was invalid.",
     * "errors": {
     * "email": {"The email is already in use."},
     * "username": {"The username is already taken by another user."}
     * }
     * }
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function update(UpdateUserRequest $request, string $user): JsonResponse
    {
        $checkAuthUser = $this->ensureAuthenticated();

        if ($checkAuthUser) {
            return $checkAuthUser;
        }

        try {
            $foundUser = User::where('id', $user)
                ->orWhere('slug', $user)
                ->first();

            if (!$foundUser) {
                return response()->json([
                    'error' => 'User not found'
                ], 404);
            }

            if (Auth::user() !== $foundUser && !Auth::user()->isSuperAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to update this user."
                ], 403);
            }

            $validated = $request->validated();

            // Handle password separately if it's being updated
            if (isset($validated['password'])) {
                $foundUser->password = $validated['password'];
                unset($validated['password']);
            }

            $foundUser->update($validated);

            return response()->json([
                "success" => "User updated successfully.",
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/users/{user}",
     * operationId="deleteUser",
     * tags={"Users"},
     * summary="Delete a user",
     * description="Deletes a user by their ID or slug. A user can delete their own account, or an admin can delete any user's account.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user",
     * in="path",
     * description="ID or slug of the user to delete",
     * required=true,
     * @OA\Schema(type="string")
     * ),
     * @OA\Response(
     * response=204,
     * description="No Content: User deleted successfully."
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to delete this user.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: User not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(Request $request, string $user): JsonResponse
    {
        $checkAuthUser = $this->ensureAuthenticated();

        if ($checkAuthUser) {
            return $checkAuthUser;
        }

        try {
            $foundUser = User::where('id', $user)
                ->orWhere('slug', $user)
                ->first();

            if (!$foundUser) {
                return response()->json([
                    'error' => 'User not found'
                ], 404);
            }

            if (Auth::user() !== $foundUser && !Auth::user()->isSuperAdmin()) {
                return response()->json([
                    'errors' => 'You are not authorized to delete this user.'
                ], 403);
            }

            $foundUser->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "error" => $e->getMessage()
            ], 500);
        }
    }
}