<?php

namespace App\Http\Controllers\Misc;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct() {
        $this->middleware('auth:sanctum');
    }

    /**
     * @OA\Get(
     * path="/api/notifications",
     * operationId="getNotifications",
     * tags={"Notifications"},
     * summary="Get authenticated user's notifications",
     * description="Retrieves a paginated list of all notifications for the authenticated user.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="page",
     * in="query",
     * description="Page number for pagination",
     * required=false,
     * @OA\Schema(type="integer", default=1)
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/NotificationPagination")
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
    public function index()
    {
        try {
            $notifications = Notification::where('user_id', Auth::user()->id)->orderByDesc('created_at')->paginate(10);
            return response()->json($notifications, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/notifications/{notification}",
     * operationId="getNotificationById",
     * tags={"Notifications"},
     * summary="Get a single notification",
     * description="Retrieves a single notification by its ID. Requires authentication and authorization to ensure the user can only view their own notifications.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="notification",
     * in="path",
     * description="ID of the notification to retrieve",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/Notification")
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Not authorized to view this notification.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: Notification not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $notification)
    {
        try {
            $notification = Notification::find($notification);

            if (!$notification) {
                return response()->json([
                    'error' => 'Notification not found'
                ], 404);
            }

            if ($notification->user_id !== Auth::user()->id && Auth::user()->role !== 'admin') {
                return response()->json([
                    'error' => 'You are not authorized to view this notification'
                ], 403);
            }

            return response()->json($notification, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/notifications/available",
     * operationId="isNotiAvailable",
     * tags={"Notifications"},
     * summary="Check for unread notifications",
     * description="Checks if the authenticated user has any unread notifications.",
     * security={{"sanctum": {}}},
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * type="object",
     * @OA\Property(property="is_read", type="boolean", description="True if no unread notifications exist, false otherwise.")
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
    public function isNotiAvailable()
    {
        try {
            $unreadCount = Notification::where('user_id', Auth::user()->id)
                                       ->where('is_read', false)
                                       ->count();

            $isRead = $unreadCount === 0;

            return response()->json([
                'is_read' => $isRead
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     * path="/api/notifications/{notification}",
     * operationId="markNotificationAsRead",
     * tags={"Notifications"},
     * summary="Mark a notification as read",
     * description="Marks a specific notification as read. The notification ID is provided in the URL.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="notification",
     * in="path",
     * description="ID of the notification to mark as read",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * type="object",
     * @OA\Property(property="success", type="string", example="Notification marked as read")
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Not authorized to mark this notification as read.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: Notification not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function markAsRead(Request $request, string $notification) 
    {
        try {
            $notification = Notification::find($notification);

            if (!$notification) {
                return response()->json([
                    'errors' => 'Notification not found'
                ], 404);
            }

            if ($notification->user_id !== Auth::user()->id) {
                return response()->json([
                    'errors' => 'You are not authorized to mark this notification as read'
                ], 403);
            }

            $notification->is_read = true;
            $notification->save();

            return response()->json([
                'success' => 'Notification marked as read'
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/notifications/{notification}",
     * operationId="deleteNotification",
     * tags={"Notifications"},
     * summary="Delete a notification",
     * description="Deletes a single notification by its ID. Requires authentication and authorization to ensure the user can only delete their own notifications.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="notification",
     * in="path",
     * description="ID of the notification to delete",
     * required=true,
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=204,
     * description="Successful operation. No content to return.",
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Not authorized to delete this notification.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: Notification not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(Request $request, string $notification)
    {
        try {
            $notification = Notification::find($notification);

            if (!$notification) {
                return response()->json([
                    'error' => 'Notification not found'
                ], 404);
            }

            if ($notification->user_id !== Auth::user()->id) {
                return response()->json([
                    'error' => 'You are not authorized to delete this notification'
                ], 403);
            }

            $notification->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
