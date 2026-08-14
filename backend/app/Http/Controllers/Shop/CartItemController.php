<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Http\Requests\Shop\UpdateCartItemRequest;
use Illuminate\Support\Facades\Auth;
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

            $cartItems = CartItem::with(['medicine' => function ($query) {
                $query->select('id', 'name', 'price');
            }])->where('cart_id', $cart->id)->get();
            
            return response()->json([
                'cart_id' => $cart->id,
                'cart_items' => $cartItems,
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
            CartItem::where('cart_id', $cartId)->delete();

            $newCartItems = [];
            foreach ($validated['items'] as $item) {
                $newCartItems[] = [
                    'cart_id' => $cart->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                ];
            }
            
            CartItem::insert($newCartItems);

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