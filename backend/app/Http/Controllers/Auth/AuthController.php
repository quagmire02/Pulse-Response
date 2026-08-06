<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\Auth\AuthRequest;
use App\Http\Controllers\Controller;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     * path="/api/login",
     * operationId="loginUser",
     * tags={"Users"},
     * summary="Log in a user",
     * description="Authenticates a user with email and password, and returns an access token.",
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"email", "password"},
     * @OA\Property(property="email", type="string", format="email", example="sahil@example.com"),
     * @OA\Property(property="password", type="string", format="password", example="Laravel@123"),
     * )
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful login",
     * @OA\JsonContent(
     * @OA\Property(property="token", type="string", description="Authentication token"),
     * @OA\Property(property="token_type", type="string", example="Bearer"),
     * @OA\Property(property="expires_at", type="string", format="date-time", example="2024-12-31 23:59:59"),
     * )
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation error or incorrect credentials",
     * @OA\JsonContent(
     * @OA\Property(property="errors", type="string", example="Credentials are incorrect.")
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function login(AuthRequest $request): JsonResponse
    {
        $validated = $request->validated();
        try {
            $user = User::where('email', $validated['email'])->first();
    
            // Check password
            if (!$user || !Hash::check($validated['password'], $user->password) || !$user->is_active) {
                return response()->json([
                    'errors' => 'Credentials are incorrect.'
                ], 422);
            }
    
            // Create token with 24-hour expiry
            $token = $user->createToken('auth_token', ['*'], now()->addHours(24))->plainTextToken;

            $role = 'user';

            if ($user->is_super_admin) {
                $role = 'super_admin';
            } elseif ($user->is_admin) {
                $role = 'admin';
            }
    
            return response()->json([
                'token' => $token,
                'user_id' => $user->id,
                'user_role' => $role,
                'token_type' => 'Bearer',
                'token_expiry' => now()->addHours(24)->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.'
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/logout",
     * operationId="logoutUser",
     * tags={"Users"},
     * summary="Log out a user",
     * description="Invalidates the current user's access token, effectively logging them out.",
     * security={{"sanctum": {}}},
     * @OA\Response(
     * response=200,
     * description="Successfully logged out",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Successfully logged out.")
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function logout(): JsonResponse
    {
        try {
            /** @var PersonalAccessToken $accessToken */
            Auth::user()->currentAccessToken()->delete();

            return response()->json([
                'success' => 'Successfully logged out.',
        ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.'
            ], 500);
        }
    }
}