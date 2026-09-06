<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('total_amount', 10, 2);
            $table->date('order_date');
            $table->enum('order_status', [
                'pending',
                'delivered',
                'canceled'
            ])->default('pending');
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
            $table->enum('subscribe_type', ['none', 'weekly', 'monthly'])->default('none');
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
