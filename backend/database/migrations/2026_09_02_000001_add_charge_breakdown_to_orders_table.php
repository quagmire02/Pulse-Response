<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_charge', 10, 2)->default(0);
            $table->decimal('premium_discount', 10, 2)->default(0);
        });
    }

        public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_charge', 'premium_discount']);
        });
    }
};
