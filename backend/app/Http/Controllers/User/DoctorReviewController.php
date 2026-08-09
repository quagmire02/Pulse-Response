<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
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
