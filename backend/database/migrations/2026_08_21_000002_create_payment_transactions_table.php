<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->string('type');
            $table->string('provider')->default('stripe');
            $table->string('provider_reference')->nullable();

            $table->decimal('amount', 10, 2);
            $table->string('currency', 8)->default('usd');
            $table->string('status');
            $table->string('description')->nullable();
            $table->text('failure_reason')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index('status');
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
