<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('discount_amount', 10, 2)->default(0)->after('total_amount');
            $table->date('next_delivery_date')->nullable()->after('subscribe_type');
            $table->boolean('is_subscription_renewal')->default(false)->after('next_delivery_date');
            $table->foreignId('parent_order_id')->nullable()->after('is_subscription_renewal')
                  ->constrained('orders')->onDelete('set null');
        });
    }

        public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['parent_order_id']);
            $table->dropColumn([
                'discount_amount',
                'next_delivery_date',
                'is_subscription_renewal',
                'parent_order_id',
            ]);
        });
    }
};
