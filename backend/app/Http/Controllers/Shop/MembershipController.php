<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MembershipController extends Controller
{
        public const MONTHLY_PRICE = 9.99;

        public const PERIOD_DAYS = 30;

    public function __construct(private StripeService $stripe)
    {
        $this->middleware('auth:sanctum');
    }

        public function status(): JsonResponse
    {
        try {
            $user = Auth::user();

            return response()->json([
                'is_premium' => $user->hasActivePremium(),
                'premium_expires_at' => $user->premium_expires_at,
                'auto_renew' => (bool) $user->membership_auto_renew,
                'has_saved_card' => filled($user->stripe_payment_method_id),
                'monthly_price' => self::MONTHLY_PRICE,
                'currency' => $this->stripe->currency(),
                'provider_configured' => $this->stripe->isConfigured(),
                'transactions' => PaymentTransaction::where('user_id', $user->id)
                    ->orderByDesc('id')
                    ->limit(20)
                    ->get(),
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

        public function subscribe(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_method' => ['required', 'string', 'max:255'],
            ]);

            $user = Auth::user();

            if ($user->hasActivePremium()) {
                return response()->json(['errors' => 'You already have an active membership.'], 409);
            }

            if (!$this->stripe->isConfigured()) {
                return response()->json([
                    'errors' => 'Payments are not configured. Set STRIPE_SECRET in the backend .env.',
                ], 503);
            }

            $customerId = $user->stripe_customer_id;

            if (!$customerId) {
                $customer = $this->stripe->createCustomer(
                    $user->email,
                    trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->username
                );

                if (!$customer['ok']) {
                    return response()->json(['errors' => $customer['error']], 422);
                }

                $customerId = $customer['data']['id'];
            }

            $attach = $this->stripe->attachPaymentMethod($validated['payment_method'], $customerId);

            if (!$attach['ok']) {
                return response()->json(['errors' => $attach['error']], 422);
            }

            $user->update([
                'stripe_customer_id' => $customerId,
                'stripe_payment_method_id' => $validated['payment_method'],
            ]);

            return $this->charge($user, PaymentTransaction::TYPE_MEMBERSHIP_INITIAL, 'Premium membership');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

        public function renew(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->stripe_customer_id || !$user->stripe_payment_method_id) {
                return response()->json(['errors' => 'No saved card. Start a membership first.'], 422);
            }

            return $this->charge($user, PaymentTransaction::TYPE_MEMBERSHIP_RENEWAL, 'Premium membership renewal');
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

        public function cancel(): JsonResponse
    {
        try {
            $user = Auth::user();

            $user->update(['membership_auto_renew' => false]);

            Notification::create([
                'user_id' => $user->id,
                'subject' => 'Membership auto renewal cancelled',
                'message' => $user->premium_expires_at
                    ? 'Your premium access stays active until ' . $user->premium_expires_at->format('Y-m-d') . '.'
                    : 'Auto renewal is off.',
            ]);

            return response()->json(['success' => 'Auto renewal cancelled.'], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

        public function ledger(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            $query = PaymentTransaction::with('user:id,username,email')
                ->filterByType($request->input('type'));

            if (!$user->isAdmin() && !$user->isSuperAdmin()) {
                $query->where('user_id', $user->id);
            }

            $transactions = $query->orderByDesc('id')->paginate($request->input('per_page', 20));

            $scope = PaymentTransaction::query()
                ->when(
                    !$user->isAdmin() && !$user->isSuperAdmin(),
                    fn ($q) => $q->where('user_id', $user->id)
                );

            return response()->json([
                'data' => $transactions->items(),
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'summary' => [
                    'total_collected' => round((float) (clone $scope)->succeeded()->sum('amount'), 2),
                    'succeeded_count' => (clone $scope)->succeeded()->count(),
                    'failed_count' => (clone $scope)->where('status', PaymentTransaction::STATUS_FAILED)->count(),
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['errors' => 'An unexpected error occurred.'], 500);
        }
    }

        private function charge(User $user, string $type, string $description): JsonResponse
    {
        $result = $this->stripe->chargeSavedMethod(
            $user->stripe_customer_id,
            $user->stripe_payment_method_id,
            self::MONTHLY_PRICE,
            $description,
            ['user_id' => $user->id, 'type' => $type]
        );

        $intent = $result['data'] ?? [];
        $succeeded = $result['ok'] && (($intent['status'] ?? null) === 'succeeded');

        $transaction = PaymentTransaction::create([
            'user_id' => $user->id,
            'type' => $type,
            'provider' => 'stripe',
            'provider_reference' => $intent['id'] ?? null,
            'amount' => self::MONTHLY_PRICE,
            'currency' => $this->stripe->currency(),
            'status' => $succeeded
                ? PaymentTransaction::STATUS_SUCCEEDED
                : PaymentTransaction::STATUS_FAILED,
            'description' => $description,
            'failure_reason' => $succeeded ? null : ($result['error'] ?? 'Charge did not complete.'),
        ]);

        if (!$succeeded) {
            return response()->json([
                'errors' => $result['error'] ?? 'The payment did not go through.',
                'transaction' => $transaction,
            ], 402);
        }

        $from = $user->premium_expires_at && $user->premium_expires_at->isFuture()
            ? $user->premium_expires_at
            : now();

        DB::transaction(function () use ($user, $from) {
            $user->update([
                'is_premium' => true,
                'premium_expires_at' => $from->copy()->addDays(self::PERIOD_DAYS),
                'membership_auto_renew' => true,
            ]);
        });

        Notification::create([
            'user_id' => $user->id,
            'subject' => 'Membership payment received',
            'message' => 'Your premium access now runs until '
                . $user->fresh()->premium_expires_at->format('Y-m-d') . '.',
        ]);

        return response()->json([
            'success' => 'Payment successful. Premium access updated.',
            'transaction' => $transaction,
            'premium_expires_at' => $user->fresh()->premium_expires_at,
        ], 200);
    }
}
