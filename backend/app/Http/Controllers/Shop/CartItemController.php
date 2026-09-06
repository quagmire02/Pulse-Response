<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Equipment;
use App\Models\Medicine;
use App\Http\Requests\Shop\UpdateCartItemRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\OpenApi\Annotations as OA;

class CartItemController extends Controller
{
    public function __construct() {
        $this->middleware('auth:sanctum');
    }

    /**
     * @OA\Get(
     * path="/api/cart-items/{user_id}",
     * operationId="getCartItemsByUserId",
     * tags={"Carts"},
     * summary="Get all cart items for a specific user",
     * description="Retrieves all cart items for a user by their ID. Requires the authenticated user to be the owner of the cart.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="user_id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="ID of the user whose cart items to retrieve"
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/CartItemList")
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to access this cart.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: Cart not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $user_id): JsonResponse
    {
        if ($user_id != Auth::id()) {
            return response()->json([
                'error' => 'You are not authorized to access this cart.',
            ], 403);
        }

        try {
            $cart = Cart::firstOrCreate(['user_id' => $user_id]);

            $cartItems = CartItem::with([
                'medicine' => function ($query) {
                    $query->select('id', 'name', 'price', 'stock', 'image_url');
                },
                'equipment' => function ($query) {
                    $query->select('id', 'vendor_id', 'name', 'price_per_day', 'sale_price', 'quantity', 'is_available', 'image');
                },
                'equipment.vendor:id,user_id,company_name,contact_phone',
            ])->where('cart_id', $cart->id)->get();

            $totals = [
                'medicines' => 0.0,
                'equipment_purchases' => 0.0,
                'equipment_rentals' => 0.0,
            ];

            foreach ($cartItems as $item) {
                $bucket = match ($item->item_type) {
                    CartItem::TYPE_EQUIPMENT_PURCHASE => 'equipment_purchases',
                    CartItem::TYPE_EQUIPMENT_RENTAL => 'equipment_rentals',
                    default => 'medicines',
                };
                $totals[$bucket] += $item->line_total;
            }

            return response()->json([
                'cart_id' => $cart->id,
                'cart_items' => $cartItems,
                'totals' => array_map(fn ($value) => round($value, 2), $totals),
                'subtotal' => round(array_sum($totals), 2),
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Put(
     * path="/api/cart-items/{cart_id}",
     * operationId="updateCartItems",
     * tags={"Carts"},
     * summary="Update a user's cart items",
     * description="Replaces all existing cart items with a new list. This acts as a full cart replacement. Requires the authenticated user to be the cart owner.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="cart_id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="ID of the cart to update"
     * ),
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(ref="#/components/schemas/UpdateCartItemRequest")
     * ),
     * @OA\Response(
     * response=200,
     * description="Cart updated successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Cart updated successfully.")
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to update this cart.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=422,
     * description="Validation Error: Invalid input.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function update(UpdateCartItemRequest $request, string $cart_id): JsonResponse
    {
        $validated = $request->validated();
        $cartId = (int) $cart_id;

        $cart = Cart::find($cartId);

        if (!$cart) {
            return response()->json([
                'error' => 'Cart not found.',
            ], 404);
        }

        if ($cart->user_id !== Auth::id()) {
            return response()->json([
                'error' => 'You are not authorized to update this cart.',
            ], 403);
        }

        try {
            $newCartItems = [];

            foreach ($validated['items'] as $item) {
                $type = $item['item_type'];

                if ($type === CartItem::TYPE_MEDICINE) {
                    $medicine = Medicine::find($item['medicine_id']);

                    if (!$medicine) {
                        return response()->json(['error' => 'Medicine not found.'], 404);
                    }

                    $newCartItems[] = [
                        'cart_id' => $cart->id,
                        'item_type' => $type,
                        'medicine_id' => $medicine->id,
                        'equipment_id' => null,
                        'quantity' => $item['quantity'],
                        'rental_start' => null,
                        'rental_end' => null,
                        'unit_price' => $medicine->price,
                    ];
                    continue;
                }

                $equipment = Equipment::find($item['equipment_id']);

                if (!$equipment) {
                    return response()->json(['error' => 'Equipment not found.'], 404);
                }

                if ($type === CartItem::TYPE_EQUIPMENT_PURCHASE) {
                    if (!$equipment->isPurchasable()) {
                        return response()->json([
                            'error' => "{$equipment->name} is not available for purchase.",
                        ], 422);
                    }

                    $unitPrice = $equipment->sale_price;
                } else {
                    if (!$equipment->isRentable()) {
                        return response()->json([
                            'error' => "{$equipment->name} is not available for rent.",
                        ], 422);
                    }

                    $unitPrice = $equipment->price_per_day;
                }

                if ($item['quantity'] > $equipment->quantity) {
                    return response()->json([
                        'error' => "Only {$equipment->quantity} unit(s) of {$equipment->name} are available.",
                    ], 422);
                }

                $newCartItems[] = [
                    'cart_id' => $cart->id,
                    'item_type' => $type,
                    'medicine_id' => null,
                    'equipment_id' => $equipment->id,
                    'quantity' => $item['quantity'],
                    'rental_start' => $type === CartItem::TYPE_EQUIPMENT_RENTAL ? $item['rental_start'] : null,
                    'rental_end' => $type === CartItem::TYPE_EQUIPMENT_RENTAL ? $item['rental_end'] : null,
                    'unit_price' => $unitPrice,
                ];
            }

            DB::transaction(function () use ($cartId, $newCartItems) {
                CartItem::where('cart_id', $cartId)->delete();

                if (!empty($newCartItems)) {
                    CartItem::insert($newCartItems);
                }
            });

            return response()->json([
                'success' => 'Cart updated successfully.',
            ], 200);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/cart-items/{cart_id}",
     * operationId="deleteCartItems",
     * tags={"Carts"},
     * summary="Delete all items from a user's cart",
     * description="Removes all cart items from a specific cart by its ID. Requires the authenticated user to be the cart owner.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="cart_id",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="ID of the cart to clear"
     * ),
     * @OA\Response(
     * response=204,
     * description="Cart items deleted successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Successfully deleted 3 cart item(s).")
     * )
     * ),
     * @OA\Response(
     * response=401,
     * description="Unauthenticated",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to delete this cart.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Not Found: Cart not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(string $cart_id): JsonResponse
    {
        $cartId = (int) $cart_id;

        $cart = Cart::find($cartId);

        if (!$cart || $cart->user_id !== Auth::id()) {
            return response()->json([
                'error' => 'You are not authorized to delete this cart.',
            ], 403);
        }

        try {
            CartItem::where('cart_id', $cartId)->delete();

            return response()->json(null, 204);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}