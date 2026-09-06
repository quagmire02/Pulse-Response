<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

        public function attachPaymentMethod(string $paymentMethodId, string $customerId): array
    {
        return $this->post("/payment_methods/{$paymentMethodId}/attach", [
            'customer' => $customerId,
        ]);
    }

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
            'automatic_payment_methods[enabled]' => 'true',
            'automatic_payment_methods[allow_redirects]' => 'never',
        ];

        foreach ($metadata as $key => $value) {
            $payload["metadata[{$key}]"] = (string) $value;
        }

        return $this->post('/payment_intents', $payload);
    }

        public function chargeSavedMethod(
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
            'off_session' => 'true',
        ];

        foreach ($metadata as $key => $value) {
            $payload["metadata[{$key}]"] = (string) $value;
        }

        return $this->post('/payment_intents', $payload);
    }
}
