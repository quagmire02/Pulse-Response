<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The accounting ledger. Every charge attempt lands here, successful or
        // not, so the money trail can be audited independently of the orders
        // and memberships that triggered it.
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            // membership_initial | membership_renewal | order_payment
            $table->string('type');
            $table->string('provider')->default('stripe');
            // Stripe PaymentIntent id, the external reference for reconciliation.
            $table->string('provider_reference')->nullable();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 8)->default('usd');
            // succeeded | failed | requires_action
            $table->string('status');
            $table->string('description')->nullable();
            $table->text('failure_reason')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
