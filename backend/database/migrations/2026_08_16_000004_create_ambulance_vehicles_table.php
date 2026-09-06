<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ambulance_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ambulance_company_id')->constrained('ambulance_companies')->onDelete('cascade');
            $table->string('vehicle_number')->unique();
            $table->string('model');
            $table->enum('status', ['available', 'busy', 'maintenance'])->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ambulance_vehicles');
    }
};
