<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

trait AuthenticateUser
{
    /**
     * Check if a user is authenticated.
     *
     * @return JsonResponse|null Returns a JsonResponse (401) if unauthenticated, otherwise null.
     */
    protected function ensureAuthenticated(): ?JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                "errors" => "Unauthenticated. Please log in to view user details."
            ], 401); // 401 Unauthorized
        }

        return null; // Return null if authenticated, allowing the method to proceed
    }
}