<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('ambulance_vehicles', function (Blueprint $table) {
            $table->foreignId('driver_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('current_lat', 10, 7)->nullable();
            $table->decimal('current_lng', 10, 7)->nullable();
            $table->timestamp('last_ping_at')->nullable();
        });
    }

        public function down(): void
    {
        Schema::table('ambulance_vehicles', function (Blueprint $table) {
            $table->dropForeign(['driver_user_id']);
            $table->dropColumn(['driver_user_id', 'current_lat', 'current_lng', 'last_ping_at']);
        });
    }
};
