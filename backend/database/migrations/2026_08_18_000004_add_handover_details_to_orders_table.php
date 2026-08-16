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
        Schema::table('orders', function (Blueprint $table) {
            // Where the courier drops medicines and where the vendor meets the
            // customer for equipment handover.
            $table->string('delivery_address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->date('preferred_handover_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_address',
                'contact_phone',
                'delivery_notes',
                'preferred_handover_date',
            ]);
        });
    }
};
