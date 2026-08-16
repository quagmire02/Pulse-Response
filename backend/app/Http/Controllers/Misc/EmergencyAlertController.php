<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Models\EmergencyAlert;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EmergencyAlertController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'alert_type' => 'required|string',
                'location' => 'required|string',
                'notes' => 'nullable|string',
            ]);

            $user = Auth::user();

            $alert = EmergencyAlert::create([
                'user_id' => $user->id,
                'alert_type' => $validated['alert_type'],
                'status' => 'pending',
                'location' => $validated['location'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create notification for emergency alert
            Notification::create([
                'user_id' => $user->id,
                'subject' => '🚨 Emergency Alert Triggered',
                'message' => "Emergency request for " . str_replace('_', ' ', $validated['alert_type']) . " has been dispatched to {$validated['location']}.",
                'is_read' => false,
            ]);

            return response()->json([
                'success' => 'Emergency alert sent successfully.',
                'data' => $alert
            ], 201);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'Failed to trigger emergency alert.'], 500);
        }
    }
}
