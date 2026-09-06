<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper over the Stripe REST API.
 *
 * Deliberately talks HTTP directly rather than pulling in stripe/stripe-php:
 * the project is handed around as a zip, and every extra composer package is
 * one more thing that has to install cleanly on someone else's machine.
 *
 * Only the tokenised charge flow is implemented, which is all the membership
 * billing needs: create a customer, attach a payment method, then charge that
 * saved method later without the cardholder present.
 */
class StripeService
{
    private const BASE_URL = 'https://api.stripe.com/v1';

    public function isConfigured(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    public function currency(): string
    {
        return config('services.stripe.currency', 'usd');
    }

    private function client(): PendingRequest
    {
        return Http::withToken(config('services.stripe.secret'))
            ->asForm()
            ->timeout(20);
    }

    /**
     * @return array{ok: bool, data: array<string, mixed>, error: ?string}
     */
    private function post(string $path, array $payload): array
    {
        if (!$this->isConfigured()) {
            return ['ok' => false, 'data' => [], 'error' => 'Stripe is not configured. Set STRIPE_SECRET in .env.'];
        }

        try {
            $response = $this->client()->post(self::BASE_URL . $path, $payload);
            $body = $response->json() ?? [];

            if ($response->successful()) {
                return ['ok' => true, 'data' => $body, 'error' => null];
            }

            // Stripe puts a human readable reason in error.message.
            $message = $body['error']['message'] ?? 'The payment provider rejected the request.';

            return ['ok' => false, 'data' => $body, 'error' => $message];
        } catch (\Exception $e) {
            Log::error('Stripe request failed: ' . $e->getMessage());

            return ['ok' => false, 'data' => [], 'error' => 'Could not reach the payment provider.'];
        }
    }

    public function createCustomer(string $email, ?string $name = null): array
    {
        return $this->post('/customers', array_filter([
            'email' => $email,
            'name' => $name,
        ]));
    }

    /**
     * Attach a payment method to a customer so it can be charged later.
     * In test mode the payment method is one of Stripe's fixtures, e.g. pm_card_visa.
     */
    public function attachPaymentMethod(string $paymentMethodId, string $customerId): array
    {
        return $this->post("/payment_methods/{$paymentMethodId}/attach", [
            'customer' => $customerId,
        ]);
    }

    /**
     * Charge a card while the customer is watching the checkout.
     *
     * Separate from chargeSavedMethod because that one sets off_session, which
     * tells Stripe nobody is at the keyboard. On a checkout the cardholder is
     * present, so a card that needs authentication should be allowed to ask for
     * it rather than being declined outright.
     *
     * @param float $amount Amount in major units, e.g. 45.50
     * @return array{ok: bool, data: array<string, mixed>, error: ?string}
     */
    public function chargeNow(
        string $customerId,
        string $paymentMethodId,
        float $amount,
        string $description,
        array $metadata = []
    ): array {
        $payload = [
            'amount' => (int) round($amount * 100),
            'currency' => $this->currency(),
            'customer' => $customerId,
            'payment_method' => $paymentMethodId,
            'description' => $description,
            'confirm' => 'true',
            // The customer is here, so redirect based authentication is not
            // something this API-only flow can complete. Failing loudly is
            // better than leaving an intent hanging.
            'automatic_payment_methods[enabled]' => 'true',
            'automatic_payment_methods[allow_redirects]' => 'never',
        ];

        foreach ($metadata as $key => $value) {
            $payload["metadata[{$key}]"] = (string) $value;
        }

        return $this->post('/payment_intents', $payload);
    }

    /**
     * Charge a saved payment method off session, which is what an automatic
     * renewal is: the customer is not at the keyboard to approve it.
     *
     * @param float $amount Amount in major units, e.g. 9.99
     * @return array{ok: bool, data: array<string, mixed>, error: ?string}
     */
    public function chargeSavedMethod(
        string $customerId,
        string $paymentMethodId,
        float $amount,
        string $description,
        array $metadata = []
    ): array {
        $payload = [
            // Stripe works in the smallest currency unit.
            'amount' => (int) round($amount * 100),
            'currency' => $this->currency(),
            'customer' => $customerId,
            'payment_method' => $paymentMethodId,
            'description' => $description,
            'confirm' => 'true',
            'off_session' => 'true',
        ];

        foreach ($metadata as $key => $value) {
            $payload["metadata[{$key}]"] = (string) $value;
        }

        return $this->post('/payment_intents', $payload);
    }
}
