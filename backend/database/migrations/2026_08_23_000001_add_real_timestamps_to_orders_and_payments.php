<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * order_date and payment_date were plain date columns and both models had
     * timestamps switched off, so every record made on the same day sorted
     * identically and the ledger showed one flat time for everything. These
     * become real datetimes and both tables get created_at/updated_at.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dateTime('order_date')->nullable()->change();
            $table->timestamps();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dateTime('payment_date')->nullable()->change();
            $table->timestamps();
        });

        // Backfill so existing rows are not left with null timestamps, which
        // would sort ahead of everything and look like they were never created.
        DB::statement('UPDATE orders SET created_at = order_date, updated_at = order_date WHERE created_at IS NULL');
        DB::statement('UPDATE payments SET created_at = payment_date, updated_at = payment_date WHERE created_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropTimestamps();
            $table->date('order_date')->nullable()->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropTimestamps();
            $table->date('payment_date')->nullable()->change();
        });
    }
};
