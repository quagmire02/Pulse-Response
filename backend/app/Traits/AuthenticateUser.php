<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

trait AuthenticateUser
{
        protected function ensureAuthenticated(): ?JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                "errors" => "Unauthenticated. Please log in to view user details."
            ], 401);
        }

        return null;
    }
}