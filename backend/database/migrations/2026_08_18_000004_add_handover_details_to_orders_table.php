<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_address')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->date('preferred_handover_date')->nullable();
        });
    }

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
