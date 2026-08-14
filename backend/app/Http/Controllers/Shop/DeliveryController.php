<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    /**
     * @OA\Get(
     * path="/api/deliveries",
     * summary="Get a paginated list of deliveries for the authenticated user or all for an admin",
     * tags={"Deliveries"},
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
     * @OA\JsonContent(
     * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/DeliveryWithOrderResponse")),
     * @OA\Property(property="links", type="object"),
     * @OA\Property(property="meta", type="object")
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function index()
    {
        try {
            $user = Auth::user();

            if ($user->isAdmin()) {
                $deliveries = Delivery::with('order')->paginate(10);
            } else {
                $deliveries = Delivery::whereHas('order', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })->with('order')->paginate(10);
            }

            return response()->json($deliveries, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => "An unexpected error occurred."
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/deliveries/{delivery}",
     * summary="Get a specific delivery by ID",
     * tags={"Deliveries"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="delivery",
     * in="path",
     * required=true,
     * description="ID of the delivery to retrieve",
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/DeliveryWithOrderResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Delivery not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $delivery)
    {
        try {
            $delivery = Delivery::with("order")->find($delivery);

            if (!$delivery) {
                return response()->json([
                    "errors" => "Delivery not found."
                ], 404);
            }

            // Check if the authenticated user is the owner of the order or an admin.
            if ($delivery->order->user_id !== Auth::user()->id && !Auth::user()->isAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to see this delivery."
                ], 403);
            }

            return response()->json($delivery, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => "An unexpected error occurred."
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/deliveries/{delivery}",
     * summary="Delete a delivery by ID (Super Admin only)",
     * tags={"Deliveries"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="delivery",
     * in="path",
     * required=true,
     * description="ID of the delivery to delete",
     * @OA\Schema(type="integer")
     * ),
     * @OA\Response(
     * response=204,
     * description="Delivery deleted successfully"
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Delivery not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(Request $request, string $delivery)
    {
        try {
            $delivery = Delivery::find($delivery);

            if (!$delivery) {
                return response()->json([
                    "errors" => "Delivery not found."
                ], 404);
            }

            if (!Auth::user()->isSuperAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to delete this delivery."
                ], 403);
            }
            
            Notification::create([
                "user_id" => $delivery->order->user_id,
                "subject" => "Delivery deleted",
                "message" => "Your delivery has been deleted."
            ]);

            $delivery->delete();
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
}
