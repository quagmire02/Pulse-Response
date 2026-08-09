<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\RegisterOrderRequest;
use App\Http\Requests\Shop\UpdateOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prescription;
use App\Models\Cart;
use App\Models\Payment;
use App\Models\Delivery;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function __construct()
    {
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
     * Handles the upload and storage of multiple prescription images.
     *
     * @param Request $request
     * @param int $orderId
     * @return void
     */
    private function prescriptionsHandler(Request $request, int $orderId): void
    {
        if ($request->hasFile('prescription_images')) {
            $user = Auth::user();
            foreach ($request->file('prescription_images') as $image) {
                $path = $image->store('prescriptions', 'public');
                $imageUrl = Storage::url($path);
                Prescription::create([
                    'user_id' => $user->id,
                    'order_id' => $orderId,
                    'image_url' => $imageUrl,
                ]);
            }
        }
    }
    
    /**
     * @OA\Get(
     * path="/api/orders",
     * summary="Get a list of all orders for the current user or all orders for staff/admin",
     * tags={"Orders"},
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
     * @OA\JsonContent(ref="#/components/schemas/OrderPagination")
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
            $orders = Auth::user()->isAdmin() ?
                        Order::with('delivery')
                             ->orderByDesc('order_date')
                             ->orderByDesc('id')
                             ->paginate(10) :
                        Order::with('delivery')
                             ->where('user_id', Auth::user()->id)
                             ->orderByDesc('order_date')
                             ->orderByDesc('id')
                             ->paginate(10);

            return response()->json($orders, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/orders/{order}",
     * summary="Get details for a specific order",
     * tags={"Orders"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="order",
     * in="path",
     * required=true,
     * description="ID of the order to retrieve",
     * @OA\Schema(type="string")
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(
     * @OA\Property(
     * property="order",
     * ref="#/components/schemas/OrderWithItemsAndPrescriptions"
     * )
     * )
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Order not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $order)
    {
        // update
        try {
            $order = Order::with([
                'orderItems.medicine' => function ($query) {
                    $query->select('id', 'name');
                },
                'user' => function ($query) {
                    $query->select('id', 'username');
                },
                'prescriptions',
                'delivery'
            ])->find($order);

            if (!$order) {
                return response()->json([
                    "errors" => "Order not found."
                ], 404);
            }

            if ($order->user_id !== Auth::user()->id && !Auth::user()->isAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to see this order."
                ], 403);
            }

            return response()->json($order, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * @OA\Post(
     * path="/api/orders",
     * summary="Create a new order from the user's cart",
     * tags={"Orders"},
     * security={{"sanctum": {}}},
     * @OA\RequestBody(
     * required=true,
     * description="Order data, including optional prescriptions and subscribe type",
     * @OA\MediaType(
     * mediaType="multipart/form-data",
     * @OA\Schema(
     * @OA\Property(
     * property="subscribe_type",
     * type="string",
     * enum={"none", "weekly", "monthly"},
     * example="none"
     * ),
     * @OA\Property(
     * property="delivery_type",
     * type="string",
     * enum={"basic", "rapid", "emergency"},
     * example="basic"
     * ),
     * @OA\Property(
     * property="prescription_images[]",
     * type="array",
     * @OA\Items(
     * type="string",
     * format="binary"
     * ),
     * description="Array of prescription image files"
     * )
     * )
     * ),
     * @OA\MediaType(
     * mediaType="application/json",
     * @OA\Schema(
     * @OA\Property(
     * property="subscribe_type",
     * type="string",
     * enum={"none", "weekly", "monthly"},
     * example="none"
     * ),
     * @OA\Property(
     * property="delivery_type",
     * type="string",
     * enum={"basic", "rapid", "emergency"},
     * example="basic"
     * ),
     * description="Order data without prescription images"
     * )
     * )
     * ),
     * @OA\Response(
     * response=201,
     * description="Order created successfully",
     * @OA\JsonContent(
     * @OA\Property(property="message", type="string", example="Order created successfully.")
     * )
     * ),
     * @OA\Response(
     * response=400,
     * description="Bad request",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Cart not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function create(RegisterOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        try {
            DB::transaction(function () use ($validated, $request) {
                $user = Auth::user();

                $cart = Cart::where('user_id', $user->id)
                            ->with('cartItems.medicine')
                            ->first();

                if (!$cart) {
                    throw new \Exception('Cart not found.');
                }

                if ($cart->cartItems->isEmpty()) {
                    throw new \Exception('Cart is empty.');
                }

                $totalAmount = 0;
                foreach ($cart->cartItems as $cartItem) {
                    if ($cartItem->medicine) {
                        $medicine = $cartItem->medicine;

                        if ($medicine->stock < $cartItem->quantity) {
                            throw new \Exception('Insufficient stock for medicine ' . $medicine->name);
                        }

                        $totalAmount += $cartItem->quantity * $cartItem->medicine->price;
                    }
                }

                $est_del_date = now()->addDays(3);
                if ($validated['delivery_type'] === 'rapid') {
                    $est_del_date = now()->addDays(1);
                    $totalAmount += 10;
                } elseif ($validated['delivery_type'] === 'emergency') {
                    $est_del_date = now()->addHour();
                    $totalAmount += 20;
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'total_amount' => $totalAmount,
                    'order_date' => now(),
                    'subscribe_type' => $validated['subscribe_type'],
                ]);

                foreach ($cart->cartItems as $cartItem) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'medicine_id' => $cartItem->medicine_id,
                        'quantity' => $cartItem->quantity,
                    ]);

                    $medicine = $cartItem->medicine;
                    $medicine->stock -= $cartItem->quantity;
                    $medicine->save();
                }

                $this->prescriptionsHandler($request, $order->id);

                $cart->cartItems()->delete();

                Delivery::create([
                    'order_id' => $order->id,
                    'track_num' => fake()->unique()->numerify('##########'),
                    'est_del_date' => $est_del_date,
                    'delivery_type' => $validated['delivery_type'],
                ]);

                $this->createNotification(
                    $user->id,
                    'Order created', 
                    "Your order ". $order->id ." has been placed and payment is pending"
                );
            });
            $order = Order::where('user_id', Auth::user()->id)->orderByDesc('order_date')->orderByDesc('id')->first();

            return response()->json([
                'order_id' => $order->id,
                'success' => 'Order created successfully.'
            ], 201);
        } catch (\Exception $e) {
            Log::error($e);

            if ($e->getMessage() === 'Cart not found.') {
                return response()->json([
                    "errors" => "Cart not found."
                ], 404);
            }

            if ($e->getMessage() === 'Cart is empty.') {
                return response()->json([
                    "errors" => "Cart is empty."
                ], 400);
            }

            if (str_contains($e->getMessage(), 'Insufficient stock for medicine')) {
                return response()->json([
                    "errors" => $e->getMessage()
                ], 400);
            }

            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }


    /**
     * @OA\Patch(
     * path="/api/orders/{order}",
     * summary="Update the status of a specific order",
     * tags={"Orders"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="order",
     * in="path",
     * required=true,
     * description="ID of the order to update",
     * @OA\Schema(type="string")
     * ),
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * @OA\Property(
     * property="order_status",
     * type="string",
     * enum={"pending", "delivered", "canceled"},
     * example="delivered"
     * ),
     * @OA\Property(
     * property="subscribe_type",
     * type="string",
     * enum={"none", "weekly", "monthly"},
     * example="none"
     * )
     * )
     * ),
     * @OA\Response(
     * response=200,
     * description="Order updated successfully",
     * @OA\JsonContent(ref="#/components/schemas/SuccessResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Order not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function update(UpdateOrderRequest $request, string $order)
    {
        $validated = $request->validated();
        try {
            $order = Order::with('orderItems.medicine')->find($order);

            if (!$order) {
                return response()->json([
                    "errors" => "Order not found."
                ], 404);
            }

            if ($order->order_status === 'delivered') {
                return response()->json([
                    "errors" => "Order already delivered."
                ], 400);
            }

            if ($order->order_status === 'canceled') {
                return response()->json([
                    "errors" => "Order already canceled."
                ], 400);
            }

            if (
                (!Auth::user()->isAdmin() &&
                $order->user_id !== Auth::user()->id &&
                $validated['order_status'] !== 'canceled') ||
                (Auth::user()->isAdmin() &&
                $order->user_id !== Auth::user()->id &&
                ($validated['order_status'] === 'canceled' ||
                isset($validated['subscribe_type'])))
            ) {
                return response()->json([
                    "errors" => "You are not authorized to set " . $validated['order_status'] . " status."
                ], 403);
            }

            $order_status_key = null;
            if (isset($validated['order_status'])) {
                $order_status_key = true;
            }

            if ($order_status_key && $validated['order_status'] === 'canceled') {
                foreach ($order->orderItems as $orderItem) {
                    if ($orderItem->medicine) {
                        $medicine = $orderItem->medicine;
                        $medicine->stock += $orderItem->quantity;
                        $medicine->save();
                    }
                }
                $order->payment_status = 'failed';
                $order->delivery()->update([
                    'delivery_status' => 'failed',
                    'est_del_date' => null,
                    'act_del_date' => null,
                ]);
            }

            if ($order_status_key && $validated['order_status'] === 'delivered') {
                $payment = Payment::where('order_id', $order->id)->first();

                if (!$payment) {
                    return response()->json([
                        "errors" => "Payment not found."
                    ], 404);
                }

                $order->payment_status = 'paid';
                $order->delivery()->update([
                    'delivery_status' => 'delivered',
                    'act_del_date' => now(),
                ]);
            }

            if (isset($validated['subscribe_type'])) {
                $order->subscribe_type = $validated['subscribe_type'];
            }

            if ($order_status_key) {
                $order->order_status = $validated['order_status'];
            }
            
            $order->save();
            
            if ($order_status_key && $validated['order_status'] === 'delivered' && in_array($order->subscribe_type, ['weekly', 'monthly'])) {
                DB::transaction(function () use ($order) {
                    foreach ($order->orderItems as $orderItem) {
                        $medicine = $orderItem->medicine;
                        if ($medicine->stock < $orderItem->quantity) {
                            throw new \Exception('Insufficient stock for medicine ' . $medicine->name . ' to renew subscription.');
                        }
                    }

                    $date = ($order->subscribe_type === 'weekly') ? now()->addWeek() : now()->addMonth();

                    $newOrder = $order->replicate([
                        'order_date',
                        'order_status',
                        'payment_status'
                    ]);
                    $newOrder->order_date = $date;
                    $newOrder->order_status = 'pending';
                    $newOrder->payment_status = 'pending';
                    $newOrder->save();

                    foreach ($order->orderItems as $orderItem) {
                        $newOrderItem = $orderItem->replicate();
                        $newOrderItem->order_id = $newOrder->id;
                        $newOrderItem->save();
                    }

                    foreach ($order->prescriptions as $prescription) {
                        $newPrescription = $prescription->replicate();
                        $newPrescription->order_id = $newOrder->id;
                        $newPrescription->save();
                    }

                    $newOrder->delivery()->create([
                        'track_num' => fake()->unique()->numerify('##########'),
                        'est_del_date' => $date,
                        'delivery_type' => $order->delivery->delivery_type,
                    ]);

                    $this->createNotification(
                    $order->user_id,
                    'Order renewed and placed at ' . $newOrder->order_date, 
                    "Your new order ". $order->id ." has been renewed and payment " . $order->payment_status
                    );
                });
            }

            $this->createNotification(
                $order->user_id, 
                'Order status updated to ' . $order->order_status, 
                "Your order ". $order->id ." has been " . $order->order_status . " and payment " . $order->payment_status
            );

            $this->createNotification(
                $order->user_id,
                'Delivery status updated to ' . $order->delivery->delivery_status,
                "Your order ". $order->id ." has been " . $order->delivery->delivery_status
            );

            return response()->json([
                'success' => 'Order updated successfully.'
            ], 200);
        } catch (\Exception $e) {
            Log::error($e);

            if (str_contains($e->getMessage(), 'Insufficient stock for medicine')) {
                return response()->json([
                    "errors" => $e->getMessage()
                ], 400);
            }

            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/orders/{order}",
     * summary="Delete a specific order (owner only)",
     * tags={"Orders"},
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="order",
     * in="path",
     * required=true,
     * description="ID of the order to delete",
     * @OA\Schema(type="string")
     * ),
     * @OA\Response(
     * response=200,
     * description="Order deleted successfully",
     * @OA\JsonContent(ref="#/components/schemas/SuccessResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Order not found",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal server error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(string $order)
    {
        try {
            $order = Order::find($order);

            if (!$order) {
                return response()->json([
                    "errors" => "Order not found."
                ], 404);
            }

            if (!Auth::user()->isSuperAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to delete this order."
                ], 403);
            }

            $this->createNotification(
                $order->user_id, 
                'Order deleted', 
                "Your order ". $order->id ." has been deleted"
            );

            $order->delete();
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
}
