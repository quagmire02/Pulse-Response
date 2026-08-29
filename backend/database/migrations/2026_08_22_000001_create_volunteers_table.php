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
        // A deliberately thin profile. A volunteer needs somewhere to report a
        // position from and somewhere to hold points, nothing more.
        Schema::create('volunteers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->string('skills')->nullable();
            $table->boolean('is_available')->default(false);

            $table->decimal('current_lat', 10, 7)->nullable();
            $table->decimal('current_lng', 10, 7)->nullable();
            $table->timestamp('last_ping_at')->nullable();

            // Spendable balance, and the all time total used for ranking.
            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->unsignedInteger('incidents_helped')->default(0);

            // Cosmetic perks bought from the rewards store.
            $table->json('unlocked_rewards')->nullable();
            $table->string('active_theme')->default('default');
            $table->string('active_font')->default('default');

            $table->timestamps();

            $table->index(['is_available', 'last_ping_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteers');
    }
};
