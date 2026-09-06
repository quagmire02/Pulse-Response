<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('equipment_fulfillments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete();
            $table->foreignId('equipment_id')->constrained('equipment')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('equipment_rental_id')->nullable()->constrained('equipment_rentals')->nullOnDelete();

            $table->string('type')->default('purchase');
            $table->unsignedInteger('quantity')->default(1);
            $table->date('rental_start')->nullable();
            $table->date('rental_end')->nullable();
            $table->decimal('total_price', 10, 2)->default(0);

            $table->string('status')->default('pending');

            $table->string('handover_address')->nullable();
            $table->string('customer_phone')->nullable();
            $table->timestamp('handover_scheduled_at')->nullable();
            $table->text('customer_note')->nullable();
            $table->text('vendor_note')->nullable();

            $table->timestamps();

            $table->index(['vendor_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('equipment_fulfillments');
    }
};
