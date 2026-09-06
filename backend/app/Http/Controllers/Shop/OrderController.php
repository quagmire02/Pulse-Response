<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\RegisterOrderRequest;
use App\Http\Requests\Shop\UpdateOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prescription;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\EquipmentFulfillment;
use App\Models\EquipmentRental;
use App\Models\Medicine;
use App\Models\Payment;
use App\Models\PaymentTransaction;
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
     * Record the money the courier just collected.
     *
     * Cash orders have no payment row until the goods actually change hands,
     * which is why marking one delivered used to fail with "Payment not found".
     * The delivery is the receipt, so the record is written here and the
     * customer is told the money was received.
     */
    private function settleOnDelivery(Order $order): Payment
    {
        $method = $order->isCashOnDelivery() ? Order::PAYMENT_CASH : Order::PAYMENT_CARD;

        $payment = Payment::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'payment_type' => $method,
            'payment_date' => now(),
        ]);

        PaymentTransaction::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'type' => PaymentTransaction::TYPE_ORDER_PAYMENT,
            'provider' => $method === Order::PAYMENT_CARD ? 'stripe' : 'cash',
            'amount' => $order->total_amount,
            'currency' => config('services.stripe.currency', 'usd'),
            'status' => PaymentTransaction::STATUS_SUCCEEDED,
            'description' => "Order #{$order->id} settled on delivery ({$method})",
        ]);

        $this->createNotification(
            $order->user_id,
            'Payment received',
            $method === Order::PAYMENT_CASH
                ? "We received \${$order->total_amount} in cash for order #{$order->id} on delivery. Nothing further is owed."
                : "Payment of \${$order->total_amount} for order #{$order->id} is settled."
        );

        return $payment;
    }

    /**
     * Take an equipment line off the shelf and open the coordination record the
     * vendor and customer use to agree on a handover. Rentals additionally get an
     * EquipmentRental row so they show up in the existing rental reporting.
     *
     * @param array<string, mixed> $validated
     */
    private function reserveEquipment(Order $order, OrderItem $orderItem, CartItem $cartItem, array $validated): void
    {
        $equipment = $cartItem->equipment;
        $isRental = $cartItem->isRental();

        $equipment->quantity -= $cartItem->quantity;
        if ($equipment->quantity <= 0) {
            $equipment->quantity = 0;
            $equipment->is_available = false;
        }
        $equipment->save();

        $rental = null;

        if ($isRental) {
            $rental = EquipmentRental::create([
                'user_id' => $order->user_id,
                'equipment_id' => $equipment->id,
                'vendor_id' => $equipment->vendor_id,
                'rental_start' => $cartItem->rental_start,
                'rental_end' => $cartItem->rental_end,
                'total_price' => $cartItem->line_total,
                'status' => 'active',
            ]);
        }

        EquipmentFulfillment::create([
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'equipment_id' => $equipment->id,
            'vendor_id' => $equipment->vendor_id,
            'user_id' => $order->user_id,
            'equipment_rental_id' => $rental?->id,
            'type' => $isRental ? EquipmentFulfillment::TYPE_RENTAL : EquipmentFulfillment::TYPE_PURCHASE,
            'quantity' => $cartItem->quantity,
            'rental_start' => $cartItem->rental_start,
            'rental_end' => $cartItem->rental_end,
            'total_price' => $cartItem->line_total,
            'status' => EquipmentFulfillment::STATUS_PENDING,
            'handover_address' => $validated['delivery_address'],
            'customer_phone' => $validated['contact_phone'],
            'customer_note' => $validated['delivery_notes'] ?? null,
        ]);

        // Let the vendor know there is something waiting on them.
        if ($equipment->vendor && $equipment->vendor->user_id) {
            $this->createNotification(
                $equipment->vendor->user_id,
                'New equipment request',
                "Order {$order->id} requests {$equipment->name}. Confirm a handover time and place from your partner dashboard."
            );
        }
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
                'orderItems.equipment' => function ($query) {
                    $query->select('id', 'vendor_id', 'name', 'category');
                },
                'orderItems.equipment.vendor:id,user_id,company_name,contact_phone',
                'equipmentFulfillments.equipment:id,name',
                'equipmentFulfillments.vendor:id,user_id,company_name,contact_phone',
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
        // Shopping is a customer-only action; partner accounts have their own dashboards.
        if (Auth::user()->resolveRole() !== 'user') {
            return response()->json([
                "errors" => "Only customer accounts can place orders."
            ], 403);
        }

        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated, $request) {
                $user = Auth::user();

                $cart = Cart::where('user_id', $user->id)
                            ->with(['cartItems.medicine', 'cartItems.equipment.vendor'])
                            ->first();

                if (!$cart) {
                    throw new \Exception('Cart not found.');
                }

                if ($cart->cartItems->isEmpty()) {
                    throw new \Exception('Cart is empty.');
                }

                // Availability check across every line before anything is written.
                $medicineSubtotal = 0;
                $equipmentSubtotal = 0;

                foreach ($cart->cartItems as $cartItem) {
                    if ($cartItem->isMedicine()) {
                        $medicine = $cartItem->medicine;

                        if (!$medicine) {
                            throw new \Exception('A medicine in your cart is no longer available.');
                        }

                        if ($medicine->stock < $cartItem->quantity) {
                            throw new \Exception('Insufficient stock for medicine ' . $medicine->name);
                        }

                        $medicineSubtotal += $cartItem->line_total;
                        continue;
                    }

                    $equipment = $cartItem->equipment;

                    if (!$equipment) {
                        throw new \Exception('An equipment item in your cart is no longer available.');
                    }

                    if ($equipment->quantity < $cartItem->quantity) {
                        throw new \Exception('Insufficient stock for equipment ' . $equipment->name);
                    }

                    $equipmentSubtotal += $cartItem->line_total;
                }

                $subtotal = $medicineSubtotal + $equipmentSubtotal;

                // The subscription discount is a medicines perk; equipment is one-off.
                $discountRate = Order::getSubscriptionDiscountRate($validated['subscribe_type']);
                $discountAmount = round($medicineSubtotal * $discountRate, 2);

                // Active premium members save 10% when they pay by card. Cash
                // orders and non members pay full price.
                $premiumDiscount = 0.0;
                if (($validated['payment_method'] ?? 'cash') === 'card' && $user->hasActivePremium()) {
                    $premiumDiscount = round(($subtotal - $discountAmount) * Order::PREMIUM_CARD_DISCOUNT_RATE, 2);
                }

                $deliveryCharge = Order::deliveryCharge($validated['delivery_type']);

                $totalAmount = round($subtotal - $discountAmount - $premiumDiscount + $deliveryCharge, 2);

                $est_del_date = match ($validated['delivery_type']) {
                    'rapid' => now()->addDay(),
                    'emergency' => now()->addHour(),
                    default => now()->addDays(3),
                };

                // Calculate next delivery date for subscriptions
                $nextDeliveryDate = Order::calculateNextDeliveryDate($validated['subscribe_type']);

                $order = Order::create([
                    'user_id' => $user->id,
                    'total_amount' => $totalAmount,
                    'discount_amount' => $discountAmount,
                    'delivery_charge' => $deliveryCharge,
                    'premium_discount' => $premiumDiscount,
                    'order_date' => now(),
                    // Recorded, not just used for the discount: the delivered
                    // handler needs to know whether the courier collects cash.
                    'payment_method' => $validated['payment_method'] ?? Order::PAYMENT_CASH,
                    'subscribe_type' => $validated['subscribe_type'],
                    'next_delivery_date' => $nextDeliveryDate,
                    'delivery_address' => $validated['delivery_address'],
                    'contact_phone' => $validated['contact_phone'],
                    'delivery_notes' => $validated['delivery_notes'] ?? null,
                    'preferred_handover_date' => $validated['preferred_handover_date'] ?? null,
                ]);

                $equipmentLines = 0;

                foreach ($cart->cartItems as $cartItem) {
                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'item_type' => $cartItem->item_type,
                        'medicine_id' => $cartItem->medicine_id,
                        'equipment_id' => $cartItem->equipment_id,
                        'quantity' => $cartItem->quantity,
                        'rental_start' => $cartItem->rental_start,
                        'rental_end' => $cartItem->rental_end,
                        'unit_price' => $cartItem->resolveUnitPrice(),
                        'line_total' => $cartItem->line_total,
                    ]);

                    if ($cartItem->isMedicine()) {
                        $medicine = $cartItem->medicine;
                        $medicine->stock -= $cartItem->quantity;
                        $medicine->save();
                        continue;
                    }

                    $equipmentLines++;
                    $this->reserveEquipment($order, $orderItem, $cartItem, $validated);
                }

                $this->prescriptionsHandler($request, $order->id);

                $cart->cartItems()->delete();

                Delivery::create([
                    'order_id' => $order->id,
                    'track_num' => fake()->unique()->numerify('##########'),
                    'est_del_date' => $est_del_date,
                    'delivery_type' => $validated['delivery_type'],
                ]);

                $notificationMessage = "Your order ". $order->id ." has been placed and payment is pending";
                if ($discountAmount > 0) {
                    $notificationMessage .= ". You saved $" . number_format($discountAmount, 2) . " with your " . $validated['subscribe_type'] . " subscription!";
                }
                if ($equipmentLines > 0) {
                    $notificationMessage .= ". The vendor will confirm a handover time and place for your equipment.";
                }

                $this->createNotification(
                    $user->id,
                    'Order created',
                    $notificationMessage
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
            $order = Order::with(['orderItems.medicine', 'orderItems.equipment', 'equipmentFulfillments.rental'])
                ->find($order);

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

                    // Equipment goes back on the shelf too.
                    if ($orderItem->isEquipment() && $orderItem->equipment) {
                        $equipment = $orderItem->equipment;
                        $equipment->quantity += $orderItem->quantity;
                        $equipment->is_available = true;
                        $equipment->save();
                    }
                }

                foreach ($order->equipmentFulfillments as $fulfillment) {
                    $fulfillment->update(['status' => EquipmentFulfillment::STATUS_CANCELLED]);

                    if ($fulfillment->rental) {
                        $fulfillment->rental->update(['status' => 'returned']);
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

                // Cash is handed to the courier, so delivery is the moment the
                // money arrives. Blocking here on a payment the customer had to
                // confirm in advance was backwards: there was nothing to
                // confirm until the goods were at the door.
                if (!$payment) {
                    $payment = $this->settleOnDelivery($order);
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
                    // Subscriptions renew the medicines only; equipment is a one-off purchase or rental.
                    $renewableItems = $order->orderItems->filter(
                        fn ($orderItem) => $orderItem->isMedicine() && $orderItem->medicine
                    );

                    if ($renewableItems->isEmpty()) {
                        return;
                    }

                    foreach ($renewableItems as $orderItem) {
                        $medicine = $orderItem->medicine;
                        if ($medicine->stock < $orderItem->quantity) {
                            throw new \Exception('Insufficient stock for medicine ' . $medicine->name . ' to renew subscription.');
                        }
                    }

                    $date = ($order->subscribe_type === 'weekly') ? now()->addWeek() : now()->addMonth();
                    $nextDeliveryDate = Order::calculateNextDeliveryDate($order->subscribe_type);
                    // Calculate subscription discount for the renewal
                    $subtotal = 0;
                    foreach ($renewableItems as $orderItem) {
                        $subtotal += $orderItem->quantity * $orderItem->medicine->price;
                    }
                    // The loyalty discount lives here, on renewals only.
                    $discountRate = Order::getRenewalDiscountRate($order->subscribe_type);
                    $discountAmount = round($subtotal * $discountRate, 2);
                    $totalAmount = $subtotal - $discountAmount;

                    // Add delivery surcharge if applicable
                    if ($order->delivery && $order->delivery->delivery_type === 'rapid') {
                        $totalAmount += 10;
                    } elseif ($order->delivery && $order->delivery->delivery_type === 'emergency') {
                        $totalAmount += 20;
                    }

                    $newOrder = Order::create([
                        'user_id' => $order->user_id,
                        'total_amount' => $totalAmount,
                        'discount_amount' => $discountAmount,
                        'order_date' => $date,
                        'order_status' => 'pending',
                        'payment_status' => 'paid',
                        'subscribe_type' => $order->subscribe_type,
                        'next_delivery_date' => $nextDeliveryDate,
                        'is_subscription_renewal' => true,
                        'parent_order_id' => $order->id,
                        // A renewal settles the same way the original did.
                        'payment_method' => $order->payment_method,
                        'delivery_address' => $order->delivery_address,
                        'contact_phone' => $order->contact_phone,
                        'delivery_notes' => $order->delivery_notes,
                    ]);

                    foreach ($renewableItems as $orderItem) {
                        OrderItem::create([
                            'order_id' => $newOrder->id,
                            'item_type' => OrderItem::TYPE_MEDICINE,
                            'medicine_id' => $orderItem->medicine_id,
                            'quantity' => $orderItem->quantity,
                            'unit_price' => $orderItem->medicine->price,
                            'line_total' => round($orderItem->quantity * $orderItem->medicine->price, 2),
                        ]);

                        // Reserve stock for the renewal order
                        $medicine = $orderItem->medicine;
                        $medicine->stock -= $orderItem->quantity;
                        $medicine->save();
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


                    // Auto-billing: create payment record automatically
                    Payment::create([
                        'user_id' => $order->user_id,
                        'order_id' => $newOrder->id,
                        'payment_date' => now(),
                        'payment_type' => $order->payment && $order->payment->payment_type ? $order->payment->payment_type : 'card',
                    ]);

                    $savings = $discountAmount > 0 ? " You saved $" . number_format($discountAmount, 2) . " with your subscription discount!" : '';
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


    /**
     * Stop a subscription from renewing.
     *
     * Allowed only while the next delivery is still at least a week away. The
     * order itself is untouched, so anything already scheduled still ships;
     * setting subscribe_type to none is what stops the renewal in update().
     */
    public function cancelSubscription(string $order): JsonResponse
    {
        try {
            $found = Order::find($order);

            if (!$found) {
                return response()->json(["errors" => "Order not found."], 404);
            }

            if ($found->user_id !== Auth::user()->id && !Auth::user()->isAdmin()) {
                return response()->json(["errors" => "You are not authorized to change this subscription."], 403);
            }

            if (!$found->isSubscription()) {
                return response()->json(["errors" => "This order is not on a subscription."], 400);
            }

            if (!$found->canCancelSubscription()) {
                $days = $found->daysUntilNextDelivery();

                return response()->json([
                    "errors" => "Subscriptions must be cancelled at least "
                        . Order::CANCELLATION_NOTICE_DAYS . " days before the next delivery."
                        . ($days !== null ? " Your next delivery is in {$days} day(s)." : ''),
                ], 422);
            }

            $found->update([
                'subscribe_type' => 'none',
                'next_delivery_date' => null,
                'unsubscribed_at' => now(),
            ]);

            $this->createNotification(
                $found->user_id,
                'Subscription cancelled',
                "Your subscription on order {$found->id} has been cancelled. No further deliveries will be scheduled."
            );

            return response()->json(['success' => 'Subscription cancelled.'], 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(["errors" => $e->getMessage()], 500);
        }
    }

    /**
     * Replace the medicines that go out on the next delivery.
     *
     * Editing happens on the pending order at the head of the renewal chain,
     * never on a delivered one, so order history stays intact. Stock was
     * already reserved when the order was created, so the difference between
     * the old and new lines is returned to or taken from the shelf here.
     */
    public function updateSubscriptionItems(Request $request, string $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'items' => ['present', 'array'],
                'items.*.medicine_id' => ['required', 'exists:medicines,id'],
                'items.*.quantity' => ['required', 'integer', 'min:1'],
            ]);

            $found = Order::with('orderItems.medicine')->find($order);

            if (!$found) {
                return response()->json(["errors" => "Order not found."], 404);
            }

            if ($found->user_id !== Auth::user()->id && !Auth::user()->isAdmin()) {
                return response()->json(["errors" => "You are not authorized to change this subscription."], 403);
            }

            if (!$found->isSubscription()) {
                return response()->json(["errors" => "This order is not on a subscription."], 400);
            }

            if ($found->order_status !== 'pending') {
                return response()->json([
                    "errors" => "Only a pending delivery can be edited. This one is already " . $found->order_status . ".",
                ], 409);
            }

            if (empty($validated['items'])) {
                return response()->json([
                    "errors" => "A subscription needs at least one medicine. Cancel it instead if you want to stop.",
                ], 422);
            }

            // Quantities currently held by this order, per medicine.
            $existing = [];
            foreach ($found->orderItems as $item) {
                if ($item->isMedicine() && $item->medicine_id) {
                    $existing[$item->medicine_id] = ($existing[$item->medicine_id] ?? 0) + $item->quantity;
                }
            }

            $requested = [];
            foreach ($validated['items'] as $line) {
                $requested[$line['medicine_id']] = ($requested[$line['medicine_id']] ?? 0) + $line['quantity'];
            }

            // Check every increase against the shelf before writing anything.
            foreach ($requested as $medicineId => $quantity) {
                $delta = $quantity - ($existing[$medicineId] ?? 0);

                if ($delta > 0) {
                    $medicine = Medicine::find($medicineId);

                    if ($medicine->stock < $delta) {
                        return response()->json([
                            "errors" => "Only {$medicine->stock} more unit(s) of {$medicine->name} are available.",
                        ], 422);
                    }
                }
            }

            DB::transaction(function () use ($found, $existing, $requested) {
                // Return stock for everything that was removed or reduced.
                foreach ($existing as $medicineId => $quantity) {
                    $delta = $quantity - ($requested[$medicineId] ?? 0);

                    if ($delta > 0) {
                        Medicine::where('id', $medicineId)->increment('stock', $delta);
                    }
                }

                // Reserve stock for everything added or increased.
                foreach ($requested as $medicineId => $quantity) {
                    $delta = $quantity - ($existing[$medicineId] ?? 0);

                    if ($delta > 0) {
                        Medicine::where('id', $medicineId)->decrement('stock', $delta);
                    }
                }

                // Swap the medicine lines; equipment lines on the same order stay put.
                $found->orderItems()
                    ->where('item_type', OrderItem::TYPE_MEDICINE)
                    ->delete();

                $subtotal = 0;

                foreach ($requested as $medicineId => $quantity) {
                    $medicine = Medicine::find($medicineId);
                    $lineTotal = round($medicine->price * $quantity, 2);
                    $subtotal += $lineTotal;

                    OrderItem::create([
                        'order_id' => $found->id,
                        'item_type' => OrderItem::TYPE_MEDICINE,
                        'medicine_id' => $medicineId,
                        'quantity' => $quantity,
                        'unit_price' => $medicine->price,
                        'line_total' => $lineTotal,
                    ]);
                }

                // Equipment already on this order keeps its charge.
                $equipmentTotal = $found->orderItems()
                    ->where('item_type', '!=', OrderItem::TYPE_MEDICINE)
                    ->sum('line_total');

                $discountRate = $found->is_subscription_renewal
                    ? Order::getRenewalDiscountRate($found->subscribe_type)
                    : Order::getSubscriptionDiscountRate($found->subscribe_type);

                $discountAmount = round($subtotal * $discountRate, 2);

                $found->update([
                    'total_amount' => round($subtotal + $equipmentTotal - $discountAmount, 2),
                    'discount_amount' => $discountAmount,
                ]);
            });

            $this->createNotification(
                $found->user_id,
                'Subscription updated',
                "The medicines on your next delivery for order {$found->id} have been updated."
            );

            return response()->json([
                'success' => 'Subscription items updated.',
                'data' => $found->fresh(['orderItems.medicine']),
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json(["errors" => $e->getMessage()], 500);
        }
    }

    /**
     * Get active subscriptions for the current user.
     * Returns orders where subscribe_type is weekly or monthly and order is not canceled.
     */
    public function getSubscriptions()
    {
        try {
            $query = Order::with(['delivery', 'orderItems.medicine' => function ($q) {
                    $q->select('id', 'name', 'price', 'image_url');
                }, 'renewalOrders' => function ($q) {
                    $q->select('id', 'parent_order_id', 'order_date', 'order_status', 'total_amount')
                      ->orderByDesc('order_date');
                }])
                ->whereIn('subscribe_type', ['weekly', 'monthly']);

            if (!Auth::user()->isAdmin()) {
                $query->where('user_id', Auth::user()->id);
            }

            // Only show active subscriptions (not canceled, not renewals — show originals)
            $subscriptions = $query->where('order_status', '!=', 'canceled')
                                   ->orderByDesc('order_date')
                                   ->orderByDesc('id')
                                   ->paginate(10);

            return response()->json($subscriptions, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
}


