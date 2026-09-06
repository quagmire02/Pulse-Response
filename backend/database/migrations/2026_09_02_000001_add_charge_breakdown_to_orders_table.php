<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * total_amount was a single number with no record of how it was reached,
     * which is why a wrong delivery charge went unnoticed. Storing the parts
     * makes the total auditable on the order page.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_charge', 10, 2)->default(0);
            $table->decimal('premium_discount', 10, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_charge', 'premium_discount']);
        });
    }
};
