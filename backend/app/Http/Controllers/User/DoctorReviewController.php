<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\DoctorReview;
use App\Models\Pharmacist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DoctorReviewController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    // GET /api/pharmacists/{pharmacist}/reviews
    public function index(string $pharmacist): JsonResponse
    {
        try {
            $pharmacist = Pharmacist::find($pharmacist);
            if (!$pharmacist) {
                return response()->json(['errors' => 'Pharmacist not found.'], 404);
            }

            $reviews = DoctorReview::with('user:id,username,first_name,last_name')
                ->where('pharmacist_id', $pharmacist->id)
                ->latest()
                ->paginate(10);

            return response()->json($reviews, 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * A review is only allowed once the patient has actually been seen: they
     * must hold a consultation with this doctor whose slot time has already
     * passed. Without this, anyone could rate a doctor they never met.
     */
    private function hasCompletedConsultation(int $userId, int $pharmacistId): bool
    {
        return Consultation::where('user_id', $userId)
            ->whereHas('slot', function ($query) use ($pharmacistId) {
                $query->where('pharmacist_id', $pharmacistId)
                    // Slots store the date and the hour the appointment starts.
                    ->where(function ($q) {
                        $q->whereDate('date', '<', now()->toDateString())
                          ->orWhere(function ($sameDay) {
                              $sameDay->whereDate('date', now()->toDateString())
                                      ->where('end_time', '<=', (int) now()->format('H'));
                          });
                    });
            })
            ->exists();
    }

    // GET /api/pharmacists/{pharmacist}/reviews/eligibility
    public function eligibility(string $pharmacist): JsonResponse
    {
        try {
            $found = Pharmacist::find($pharmacist);

            if (!$found) {
                return response()->json(['errors' => 'Doctor not found.'], 404);
            }

            $user = Auth::user();
            $eligible = !$user->isAdmin()
                && $this->hasCompletedConsultation($user->id, $found->id);

            return response()->json([
                'can_review' => $eligible,
                'already_reviewed' => DoctorReview::where('user_id', $user->id)
                    ->where('pharmacist_id', $found->id)
                    ->exists(),
                'reason' => $eligible
                    ? null
                    : 'You can review this doctor after your booked consultation has taken place.',
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    // POST /api/pharmacists/{pharmacist}/reviews
    public function create(Request $request, string $pharmacist): JsonResponse
    {
        if (Auth::user()->isAdmin()) {
            return response()->json(['errors' => 'Admins cannot submit reviews.'], 403);
        }

        $validated = $request->validate([
            'rating'  => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $pharmacist = Pharmacist::find($pharmacist);
            if (!$pharmacist) {
                return response()->json(['errors' => 'Pharmacist not found.'], 404);
            }

            if (!$this->hasCompletedConsultation(Auth::id(), $pharmacist->id)) {
                return response()->json([
                    'errors' => 'You can only review a doctor after a consultation you booked has taken place.',
                ], 403);
            }

            DoctorReview::updateOrCreate(
                ['user_id' => Auth::id(), 'pharmacist_id' => $pharmacist->id],
                $validated
            );

            return response()->json(['success' => 'Review submitted successfully.'], 201);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

    // DELETE /api/pharmacists/{pharmacist}/reviews
    public function destroy(string $pharmacist): JsonResponse
    {
        try {
            $review = DoctorReview::where('user_id', Auth::id())
                ->where('pharmacist_id', $pharmacist)
                ->first();

            if (!$review) {
                return response()->json(['errors' => 'Review not found.'], 404);
            }

            $review->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }
}
