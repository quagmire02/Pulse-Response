<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * How an order settles was only ever a request field used to work out the
 * premium discount, so nothing downstream knew whether an order was cash on
 * delivery. Storing it lets the delivered handler settle cash orders by itself
 * instead of demanding the customer confirm a payment up front.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method')->default('cash')->after('payment_status');
        });

        // Existing orders that already have a card payment recorded were paid at
        // checkout; everything else was cash on delivery.
        DB::statement("
            UPDATE orders
            SET payment_method = 'card'
            WHERE id IN (SELECT order_id FROM payments WHERE payment_type = 'card')
        ");
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
