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
        // One row per volunteer who was within range of an incident. This is
        // both the notification record and the proof of who turned up.
        Schema::create('volunteer_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_alert_id')->constrained('emergency_alerts')->onDelete('cascade');
            $table->foreignId('volunteer_id')->constrained('volunteers')->onDelete('cascade');

            $table->decimal('distance_km', 8, 2)->nullable();

            // notified -> responded -> closed | cancelled
            $table->string('status')->default('notified');
            $table->timestamp('responded_at')->nullable();
            $table->unsignedInteger('points_awarded')->default(0);

            $table->timestamps();

            $table->unique(['emergency_alert_id', 'volunteer_id']);
            $table->index(['volunteer_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteer_alerts');
    }
};
