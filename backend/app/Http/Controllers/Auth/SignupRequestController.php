<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterSignupRequest;
use App\Models\AmbulanceCompany;
use App\Models\AmbulanceVehicle;
use App\Models\Cart;
use App\Models\Notification;
use App\Models\Pharmacist;
use App\Models\SignupRequest;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Volunteer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class SignupRequestController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['store']);
    }

    /**
     * Guard every admin-only endpoint of this controller.
     */
    private function ensureAdmin(): ?JsonResponse
    {
        if (!Auth::user()->isAdmin() && !Auth::user()->isSuperAdmin()) {
            return response()->json([
                'errors' => 'You are not authorized to manage signup requests.',
            ], 403);
        }

        return null;
    }

    /**
     * @OA\Post(
     * path="/api/signup-requests",
     * operationId="createSignupRequest",
     * tags={"Signup Requests"},
     * summary="Submit a signup request for admin approval",
     * description="Anyone can submit a signup request choosing a role. The account is only created
     * on the users table once an admin approves the request, so the applicant cannot log in before that.",
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"email", "username", "password", "password_confirmation", "role"},
     * @OA\Property(property="first_name", type="string", nullable=true, example="Jane"),
     * @OA\Property(property="last_name", type="string", nullable=true, example="Doe"),
     * @OA\Property(property="email", type="string", format="email", example="jane.doe@example.com"),
     * @OA\Property(property="username", type="string", example="janedoe"),
     * @OA\Property(property="password", type="string", format="password", example="Password123!"),
     * @OA\Property(property="password_confirmation", type="string", format="password", example="Password123!"),
     * @OA\Property(property="address", type="string", nullable=true, example="456 Business Ave"),
     * @OA\Property(property="role", type="string", enum={"user", "pharmacist", "doctor", "vendor"}, example="pharmacist"),
     * @OA\Property(property="license_num", type="string", nullable=true, example="112233"),
     * @OA\Property(property="speciality", type="string", nullable=true, example="Cardiology"),
     * @OA\Property(property="bio", type="string", nullable=true, example="10 years of experience."),
     * @OA\Property(property="company_name", type="string", nullable=true, example="MediSupply Ltd"),
     * @OA\Property(property="contact_phone", type="string", nullable=true, example="+8801700000000"),
     * )
     * ),
     * @OA\Response(
     * response=201,
     * description="Signup request submitted",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Signup request submitted. An admin will review it shortly.")
     * )
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function store(RegisterSignupRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $validated['password'] = Hash::make($validated['password']);
            $validated['status'] = SignupRequest::STATUS_PENDING;

            SignupRequest::create($validated);

            return response()->json([
                'success' => 'Signup request submitted. You will be able to log in once an admin approves it.',
            ], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/signup-requests",
     * operationId="getSignupRequests",
     * tags={"Signup Requests"},
     * summary="List signup requests (admin only)",
     * security={{"sanctum": {}}},
     * @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"pending", "approved", "rejected"})),
     * @OA\Parameter(name="role", in="query", required=false, @OA\Schema(type="string", enum={"user", "pharmacist", "doctor", "vendor"})),
     * @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string")),
     * @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     * @OA\Response(response=200, description="Successful operation"),
     * @OA\Response(response=403, description="Forbidden", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=500, description="Internal Server Error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->ensureAdmin()) {
            return $denied;
        }

        try {
            $query = SignupRequest::with('reviewer:id,username');

            $query->filterByStatus($request->input('status'))
                  ->filterByRole($request->input('role'))
                  ->search($request->input('search'));

            $perPage = $request->input('per_page', 10);
            $requests = $query->orderByDesc('created_at')
                              ->orderByDesc('id')
                              ->paginate($perPage);

            return response()->json($requests, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/signup-requests/pending-count",
     * operationId="getPendingSignupRequestCount",
     * tags={"Signup Requests"},
     * summary="Count signup requests still awaiting review (admin only)",
     * security={{"sanctum": {}}},
     * @OA\Response(response=200, description="Successful operation"),
     * @OA\Response(response=403, description="Forbidden", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function pendingCount(): JsonResponse
    {
        if ($denied = $this->ensureAdmin()) {
            return $denied;
        }

        try {
            return response()->json([
                'count' => SignupRequest::where('status', SignupRequest::STATUS_PENDING)->count(),
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/signup-requests/{signupRequest}/approve",
     * operationId="approveSignupRequest",
     * tags={"Signup Requests"},
     * summary="Approve a signup request and create the real account (admin only)",
     * description="Moves the stored account details onto the users table and creates the matching
     * pharmacist/vendor profile, after which the applicant can log in.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(name="signupRequest", in="path", required=true, @OA\Schema(type="integer")),
     * @OA\Response(response=200, description="Signup request approved"),
     * @OA\Response(response=403, description="Forbidden", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=409, description="Already reviewed", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=500, description="Internal Server Error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function approve(Request $request, string $signupRequest): JsonResponse
    {
        if ($denied = $this->ensureAdmin()) {
            return $denied;
        }

        try {
            // Driver approvals carry the ambulance the admin is assigning them to.
            $validated = $request->validate([
                'vehicle_id' => ['nullable', 'exists:ambulance_vehicles,id'],
            ]);

            $found = SignupRequest::find($signupRequest);

            if (!$found) {
                return response()->json(['errors' => 'Signup request not found.'], 404);
            }

            if (!$found->isPending()) {
                return response()->json([
                    'errors' => 'This signup request has already been ' . $found->status . '.',
                ], 409);
            }

            // The applicant may have been created manually in the meantime.
            $taken = User::where('email', $found->email)
                ->orWhere('username', $found->username)
                ->exists();

            if ($taken) {
                return response()->json([
                    'errors' => 'An account with this email or username already exists.',
                ], 409);
            }

            // vendors.license_num is unique; another vendor may have claimed it since submission.
            if ($found->needsVendorProfile() && Vendor::where('license_num', $found->license_num)->exists()) {
                return response()->json([
                    'errors' => 'This vendor license number is already registered.',
                ], 409);
            }

            if ($found->needsAmbulanceCompanyProfile()
                && AmbulanceCompany::where('license_num', $found->license_num)->exists()) {
                return response()->json([
                    'errors' => 'This ambulance company license number is already registered.',
                ], 409);
            }

            // A driver is only useful once attached to an ambulance, so the admin
            // must pick a free vehicle at approval time.
            $vehicle = null;

            if ($found->isDriver()) {
                if (empty($validated['vehicle_id'])) {
                    return response()->json([
                        'errors' => 'Select an ambulance to assign this driver to.',
                    ], 422);
                }

                $vehicle = AmbulanceVehicle::find($validated['vehicle_id']);

                if ($vehicle->driver_user_id) {
                    return response()->json([
                        'errors' => 'That ambulance already has a driver assigned.',
                    ], 409);
                }
            }

            DB::transaction(function () use ($found, $vehicle) {
                $user = User::create([
                    'first_name' => $found->first_name,
                    'last_name' => $found->last_name,
                    'email' => $found->email,
                    'username' => $found->username,
                    'address' => $found->address,
                    // Already hashed on submission, the User model passes hashes straight through.
                    'password' => $found->password,
                    'role' => $found->role,
                ]);

                Cart::create([
                    'user_id' => $user->id,
                ]);

                if ($found->needsPharmacistProfile()) {
                    Pharmacist::create([
                        'user_id' => $user->id,
                        'license_num' => (int) $found->license_num,
                        'speciality' => $found->speciality,
                        'bio' => $found->bio,
                        'is_consultation' => $found->is_consultation,
                    ]);
                }

                if ($found->needsVendorProfile()) {
                    Vendor::create([
                        'user_id' => $user->id,
                        'company_name' => $found->company_name,
                        'license_num' => $found->license_num,
                        'description' => $found->description,
                        'contact_phone' => $found->contact_phone,
                    ]);
                }

                if ($found->needsVolunteerProfile()) {
                    Volunteer::create([
                        'user_id' => $user->id,
                        'skills' => $found->bio,
                        'is_available' => false,
                    ]);
                }

                if ($found->needsAmbulanceCompanyProfile()) {
                    AmbulanceCompany::create([
                        'user_id' => $user->id,
                        'company_name' => $found->company_name,
                        'license_num' => $found->license_num,
                        'description' => $found->description,
                        'contact_phone' => $found->contact_phone,
                    ]);
                }

                // Linking the vehicle here is what makes the driver console and
                // the dispatcher work for this account.
                if ($vehicle) {
                    $vehicle->update(['driver_user_id' => $user->id]);
                }

                Notification::create([
                    'user_id' => $user->id,
                    'subject' => 'Account approved',
                    'message' => 'Welcome to Pulse Response! Your ' . $found->role . ' account has been approved.',
                ]);

                $found->update([
                    'status' => SignupRequest::STATUS_APPROVED,
                    'reviewed_by' => Auth::user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => null,
                ]);
            });

            return response()->json([
                'success' => 'Signup request approved and account created.',
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/signup-requests/{signupRequest}/reject",
     * operationId="rejectSignupRequest",
     * tags={"Signup Requests"},
     * summary="Reject a signup request (admin only)",
     * security={{"sanctum": {}}},
     * @OA\Parameter(name="signupRequest", in="path", required=true, @OA\Schema(type="integer")),
     * @OA\RequestBody(
     * required=false,
     * @OA\JsonContent(
     * @OA\Property(property="rejection_reason", type="string", nullable=true, example="License number could not be verified.")
     * )
     * ),
     * @OA\Response(response=200, description="Signup request rejected"),
     * @OA\Response(response=403, description="Forbidden", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=409, description="Already reviewed", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=500, description="Internal Server Error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function reject(Request $request, string $signupRequest): JsonResponse
    {
        if ($denied = $this->ensureAdmin()) {
            return $denied;
        }

        try {
            $validated = $request->validate([
                'rejection_reason' => ['nullable', 'string', 'max:1000'],
            ]);

            $found = SignupRequest::find($signupRequest);

            if (!$found) {
                return response()->json(['errors' => 'Signup request not found.'], 404);
            }

            if (!$found->isPending()) {
                return response()->json([
                    'errors' => 'This signup request has already been ' . $found->status . '.',
                ], 409);
            }

            $found->update([
                'status' => SignupRequest::STATUS_REJECTED,
                'rejection_reason' => $validated['rejection_reason'] ?? null,
                'reviewed_by' => Auth::user()->id,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'success' => 'Signup request rejected.',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/signup-requests/{signupRequest}",
     * operationId="deleteSignupRequest",
     * tags={"Signup Requests"},
     * summary="Delete a reviewed signup request from the queue (admin only)",
     * security={{"sanctum": {}}},
     * @OA\Parameter(name="signupRequest", in="path", required=true, @OA\Schema(type="integer")),
     * @OA\Response(response=204, description="Deleted"),
     * @OA\Response(response=403, description="Forbidden", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
     * @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
     * )
     */
    public function destroy(string $signupRequest): JsonResponse
    {
        if ($denied = $this->ensureAdmin()) {
            return $denied;
        }

        try {
            $found = SignupRequest::find($signupRequest);

            if (!$found) {
                return response()->json(['errors' => 'Signup request not found.'], 404);
            }

            if ($found->isPending()) {
                return response()->json([
                    'errors' => 'Review this request before removing it from the queue.',
                ], 409);
            }

            $found->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => 'An unexpected error occurred.',
            ], 500);
        }
    }
}
