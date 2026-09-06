<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ambulance_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ambulance_company_id')->constrained('ambulance_companies')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('ambulance_vehicles')->onDelete('cascade');
            $table->foreignId('emergency_alert_id')->nullable()->constrained('emergency_alerts')->onDelete('set null');
            $table->string('patient_name')->nullable();
            $table->timestamp('dispatch_time')->nullable();
            $table->timestamp('arrival_time')->nullable();
            $table->timestamp('completion_time')->nullable();
            $table->decimal('revenue', 10, 2)->default(0.00);
            $table->integer('response_delay_minutes')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ambulance_trips');
    }
};
