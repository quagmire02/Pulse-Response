<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\RegisterPaymentRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    
    /**
     * @OA\Get(
     * path="/api/payments",
     * operationId="getPaymentsList",
     * tags={"Payments"},
     * summary="Get a list of payments, optionally filtered by order",
     * description="Retrieves a paginated list of all payments. SuperAdmins can see all payments, while other users can only see their own. An optional order_id query parameter can be used to filter payments.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="page",
     * in="query",
     * description="Page number for pagination",
     * required=false,
     * @OA\Schema(type="integer", default=1)
     * ),
     * @OA\Parameter(
     * name="order_id",
     * in="query",
     * required=false,
     * @OA\Schema(type="integer"),
     * description="Filter payments by a specific order ID"
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/PaymentPagination")
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
    public function index(Request $request)
    {
        try {
            $query = Payment::query();

            if (!Auth::user()->isSuperAdmin()) {
                $query->where('user_id', Auth::user()->id);
            }

            if ($request->has('order_id')) {
                $query->where('order_id', $request->input('order_id'));
            }

            $payments = $query->paginate(10);

            return response()->json($payments, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     * path="/api/payments/{payment}",
     * operationId="getPaymentById",
     * tags={"Payments"},
     * summary="Get a single payment by ID",
     * description="Retrieves a specific payment record by its ID. Users can only access their own payments unless they are a SuperAdmin.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="payment",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="ID of the payment to retrieve"
     * ),
     * @OA\Response(
     * response=200,
     * description="Successful operation",
     * @OA\JsonContent(ref="#/components/schemas/Payment")
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: You are not authorized to view this payment.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Payment not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function show(string $payment)
    {
        try {
            $payment = Payment::find($payment);

            if (!$payment) {
                return response()->json([
                    "errors" => "Payment not found."
                ], 404);
            }

            if ($payment->user_id !== Auth::user()->id && !Auth::user()->isSuperAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to view this payment."
                ], 403);
            }

            return response()->json($payment, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/payments",
     * operationId="createPayment",
     * tags={"Payments"},
     * summary="Create a new payment",
     * description="Creates a new payment for a specified order. The authenticated user must own the order.",
     * security={{"sanctum": {}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(ref="#/components/schemas/RegisterPaymentRequest")
     * ),
     * @OA\Response(
     * response=201,
     * description="Payment created successfully",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="string", example="Payment successful.")
     * )
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Not authorized to create a payment for this order.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Order not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function create(RegisterPaymentRequest $request)
    {
        $validated = $request->validated();

        try {
            $order = Order::find($validated['order_id']);

            if (!$order) {
                return response()->json([
                    "errors" => "Order not found."
                ], 404);
            }

            if ($order->user_id !== Auth::user()->id) {
                return response()->json([
                    "errors" => "You are not authorized to create a payment for this order."
                ], 403);
            }

            $validated['user_id'] = Auth::user()->id;
            $validated['payment_date'] = now();
            Payment::create($validated);

            Notification::create([
                "user_id" => $order->user_id,
                "subject" => "Payment successful.",
                "message" => "Your payment for order #{$order->id} has been successful."
            ]);

            $order->update(['payment_status' => 'paid']);

            return response()->json([
                "success" => "Payment successful."
            ], 201);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     * path="/api/payments/{payment}",
     * operationId="deletePayment",
     * tags={"Payments"},
     * summary="Delete a payment",
     * description="Deletes a specific payment by its ID. Only SuperAdmins are authorized to perform this action.",
     * security={{"sanctum": {}}},
     * @OA\Parameter(
     * name="payment",
     * in="path",
     * required=true,
     * @OA\Schema(type="integer"),
     * description="ID of the payment to delete"
     * ),
     * @OA\Response(
     * response=204,
     * description="Payment deleted successfully. No content returned."
     * ),
     * @OA\Response(
     * response=403,
     * description="Forbidden: Not authorized to delete this payment.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=404,
     * description="Payment not found.",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * ),
     * @OA\Response(
     * response=500,
     * description="Internal Server Error",
     * @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     * )
     * )
     */
    public function destroy(Request $request, string $payment)
    {
        try {
            $payment = Payment::find($payment);

            if (!$payment) {
                return response()->json([
                    "errors" => "Payment not found."
                ], 404);
            }

            if (!Auth::user()->isSuperAdmin()) {
                return response()->json([
                    "errors" => "You are not authorized to delete this payment."
                ], 403);
            }
            
            Notification::create([
                "user_id" => $payment->user_id,
                "subject" => "Payment deleted.",
                "message" => "Your payment for order #{$payment->order_id} has been deleted."
            ]);
            
            $payment->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "errors" => $e->getMessage()
            ], 500);
        }
    }
}
