<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('emergency_alerts', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->foreignId('assigned_vehicle_id')->nullable()
                  ->constrained('ambulance_vehicles')->nullOnDelete();
            $table->decimal('assigned_distance_km', 8, 2)->nullable();
            $table->integer('assigned_eta_minutes')->nullable();
        });
    }

        public function down(): void
    {
        Schema::table('emergency_alerts', function (Blueprint $table) {
            $table->dropForeign(['assigned_vehicle_id']);
            $table->dropColumn([
                'latitude',
                'longitude',
                'assigned_vehicle_id',
                'assigned_distance_km',
                'assigned_eta_minutes',
            ]);
        });
    }
};
