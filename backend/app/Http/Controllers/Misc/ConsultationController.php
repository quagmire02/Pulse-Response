<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Http\Requests\Misc\RegisterConsultationRequest;
use App\Http\Requests\Misc\UpdateConsultationRequest;
use App\Http\Resources\Misc\SlotResource;
use App\Http\Resources\Misc\ConsultationResource;
use App\Models\Consultation;
use App\Models\Pharmacist;
use App\Models\Slot;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;


class ConsultationController extends Controller
{
    public function __construct() {
        $this->middleware('auth:sanctum');
    }

    private function createNotification($userID, $subject, $message) {
        Notification::create([
            'user_id' => $userID,
            'subject' => $subject,
            'message' => $message,
        ]);
    }

    /**
     * @OA\Get(
     * path="/api/consultations",
     * summary="Get all consultations for the authenticated user.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\Response(
     * response=200,
     * description="A paginated list of consultations.",
     * @OA\JsonContent(
     * type="object",
     * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Consultation")),
     * @OA\Property(property="meta", type="object"),
     * @OA\Property(property="links", type="object")
     * )
     * ),
     * @OA\Response(response=401, description="Unauthorized"),
     * @OA\Response(response=500, description="Server error")
     * )
     */
    public function index()
    {
        try {
            $user = Auth::user();

            if ($user->isSuperAdmin()) {
                $consultations = Consultation::paginate(10);
            } elseif ($user->isAdmin()) {
                $consultations = Consultation::whereHas('slot', function ($query) use ($user) {
                    $query->where('pharmacist_id', $user->pharmacist->id);
                })->paginate(10);
            } else {
                $consultations = Consultation::where('user_id', $user->id)->paginate(10);
            }

            return response()->json($consultations, 200);
        } catch (\Exception $e) {
            Log::error("Error fetching consultations: " . $e->getMessage());
            return response()->json([
                'error' => "Failed to retrieve consultations."
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/slots/{pharmacist}",
     * summary="Get all available slots for a pharmacist.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="pharmacist",
     * in="path",
     * required=true,
     * @OA\Schema(type="string")
     * ),
     * @OA\Parameter(
     * name="date",
     * in="query",
     * required=false,
     * @OA\Schema(type="string", format="date", example="2025-10-27"),
     * description="Optional date to filter slots."
     * ),
     * @OA\Response(
     * response=200,
     * description="A list of available slots.",
     * @OA\JsonContent(
     * type="array",
     * @OA\Items(ref="#/components/schemas/Slot")
     * )
     * ),
     * @OA\Response(response=404, description="Pharmacist not found"),
     * @OA\Response(response=500, description="Server error")
     * )
     */
    public function allSlots(Request $request, string $pharmacist) {
        try {
            $pharmacist = Pharmacist::find($pharmacist);

            if (!$pharmacist) {
                return response()->json([
                    'error' => 'Pharmacist not found'
                ], 404);
            }

            $slots = Slot::where('pharmacist_id', $pharmacist->id);

            if ($request->has('date')) {
                $slots->where('date', $request->query('date'));
            }

            $slots = $slots->get();

            return SlotResource::collection($slots);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/consultations/{id}",
     * summary="Get a specific consultation by ID.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=200,
     * description="A single consultation object.",
     * @OA\JsonContent(ref="#/components/schemas/ConsultationResource")
     * ),
     * @OA\Response(response=403, description="Forbidden"),
     * @OA\Response(response=404, description="Consultation not found")
     * )
     */
    public function show(string $consultation)
    {
        try {
            $consultation = Consultation::with([
                'userWithUsername', 
                'slot.pharmacist.user'
            ])->find($consultation);

            if (!$consultation) {
                return response()->json([
                    'error' => 'Consultation not found'
                ], 404);
            }

            $user = Auth::user();
            $pharmacist = $consultation->slot->pharmacist;

            if (
                $user->isSuperAdmin() ||
                ($user->isAdmin() && $pharmacist->user_id === $user->id) ||
                $consultation->user_id === $user->id
            ) {
                return new ConsultationResource($consultation);
            }

            return response()->json([
                'error' => 'You are not authorized to view this consultation'
            ], 403);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/consultations",
     * summary="Book a new consultation.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(ref="#/components/schemas/RegisterConsultationRequest")
     * ),
     * @OA\Response(
     * response=201,
     * description="Consultation booked successfully.",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Consultation booked successfully.")
     * )
     * ),
     * @OA\Response(response=403, description="Forbidden. Admins cannot register consultations."),
     * @OA\Response(response=409, description="Conflict. The requested slot is already booked."),
     * @OA\Response(response=422, description="Validation errors."),
     * @OA\Response(response=500, description="Server error.")
     * )
     */
    public function create(RegisterConsultationRequest $request)
    {
        if (Auth::user()->isAdmin()) {
            return response()->json([
                'error' => 'Admins cannot register consultations.'
            ], 403);
        }

        try {
            DB::beginTransaction();
            
            $validatedData = $request->validated();
            
            $pharmacistId = $validatedData['pharmacist_id'];
            $date = $validatedData['date'];
            $startHour = $validatedData['start_time'];

            $endHour = $startHour + 1;

            $slot = Slot::where('pharmacist_id', $pharmacistId)
                        ->where('date', $date)
                        ->where('start_time', $startHour)
                        ->first();

            if ($slot) {
                if (!$slot->is_available) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'This slot is already booked.'
                    ], 409);
                }
                
                $slot->is_available = false;
                $slot->save();
            } else {
                $slot = Slot::create([
                    'pharmacist_id' => $pharmacistId,
                    'date' => $date,
                    'start_time' => $startHour,
                    'end_time' => $endHour,
                    'is_available' => false,
                ]);
            }

            Consultation::create([
                'user_id' => Auth::user()->id,
                'slot_id' => $slot->id,
            ]);

            $startTime = $startHour > 12 ? $startHour - 12 : $startHour;
            $startPeriod = $startHour >= 12 ? 'PM' : 'AM';
            $endTime = $endHour > 12 ? $endHour - 12 : $endHour;
            $endPeriod = $endHour >= 12 ? 'PM' : 'AM';
            $pharmacist = Pharmacist::find($pharmacistId);

            $this->createNotification(
                $pharmacistId, 
                'New consultation for ' . Auth::user()->username, 
                'You have a new consultation scheduled for ' . $date . ' from ' . $startTime . ':00 ' . $startPeriod . ' to ' . $endTime . ':00 ' . $endPeriod . '.'
            );

            $this->createNotification(
                Auth::user()->id, 
                'New consultation for ' . $pharmacist->user->username, 
                'You have a new consultation scheduled for ' . $date . ' from ' . $startTime . ':00 ' . $startPeriod . ' to ' . $endTime . ':00 ' . $endPeriod . '.'
            );

            DB::commit();

            return response()->json([
                'success' => 'Consultation booked successfully.',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error during consultation booking: " . $e->getMessage());
            return response()->json([
                'error' => 'Failed to book consultation.'
            ], 500);
        }
    }

    /**
     * @OA\Patch(
     * path="/api/consultations/{id}",
     * summary="Update a consultation's status.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(ref="#/components/schemas/UpdateConsultationRequest")
     * ),
     * @OA\Response(response=200, description="Consultation updated successfully."),
     * @OA\Response(response=403, description="Forbidden."),
     * @OA\Response(response=404, description="Consultation not found."),
     * @OA\Response(response=422, description="Validation errors."),
     * @OA\Response(response=500, description="Server error.")
     * )
     */
    public function update(UpdateConsultationRequest $request, string $consultation)
    {
        try {
            DB::beginTransaction();

            $consultation = Consultation::with('slot')->find($consultation);

            if (!$consultation) {
                DB::rollBack(); // Rollback if not found
                return response()->json([
                    'error' => 'Consultation not found'
                ], 404);
            }

            $validatedData = $request->validated();
            $user = Auth::user();
            $isAuthorized = false;

            if ($user->isSuperAdmin() || ($user->isAdmin() && $consultation->slot->pharmacist->user_id === $user->id)) {
                $isAuthorized = true;
            }
            elseif ($consultation->user_id === $user->id && $validatedData['status'] === 'rejected') {
                $isAuthorized = true;
            }

            if (!$isAuthorized) {
                DB::rollBack();
                return response()->json([
                    'error' => 'You are not authorized to update this consultation.'
                ], 403);
            }

            if ($validatedData['status'] === 'completed') {
                $validatedData['completed_at'] = now();
            } elseif ($validatedData['status'] === 'confirmed') {
                $validatedData['confirmed_at'] = now();
            } elseif ($validatedData['status'] === 'rejected') {
                $consultation->slot()->update([
                    'is_available' => true
                ]);
            }

            $consultation->update($validatedData);

            $this->createNotification(
                $consultation->user_id, 
                'Consultation status updated for ' . $consultation->slot->pharmacist->user->username, 
                'Your consultation has been ' . $validatedData['status'] . '.'
            );

            $this->createNotification(
                $consultation->slot->pharmacist->user_id, 
                'Consultation status updated for ' . $consultation->user->username, 
                'Your consultation has been ' . $validatedData['status'] . '.'
            );

            DB::commit();

            return response()->json([
                'success' => 'Consultation updated successfully.'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/consultations/{id}",
     * summary="Delete a consultation.",
     * tags={"Consultations"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(response=204, description="Consultation deleted successfully."),
     * @OA\Response(response=403, description="Forbidden."),
     * @OA\Response(response=404, description="Consultation not found."),
     * @OA\Response(response=500, description="Server error.")
     * )
     */
    public function destroy(Request $request, string $consultation)
    {
        try {
            $consultation = Consultation::find($consultation);

            if (!$consultation) {
                return response()->json([
                    'error' => 'Consultation not found'
                ], 404);
            }

            if (!Auth::user()->isSuperAdmin()) {
                return response()->json([
                    'error' => 'You are not authorized to delete this consultation'
                ], 403);
            }

            $this->createNotification(
                $consultation->user_id, 
                'Consultation deleted', 
                'Your consultation has been deleted.'
            );

            $this->createNotification(
                $consultation->slot->pharmacist->user_id, 
                'Consultation deleted', 
                'Your consultation has been deleted.'
            );

            $consultation->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
