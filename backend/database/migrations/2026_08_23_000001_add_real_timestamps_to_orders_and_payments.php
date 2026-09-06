<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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

        DB::statement('UPDATE orders SET created_at = order_date, updated_at = order_date WHERE created_at IS NULL');
        DB::statement('UPDATE payments SET created_at = payment_date, updated_at = payment_date WHERE created_at IS NULL');
    }

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
