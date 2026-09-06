<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('volunteers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->string('skills')->nullable();
            $table->boolean('is_available')->default(false);

            $table->decimal('current_lat', 10, 7)->nullable();
            $table->decimal('current_lng', 10, 7)->nullable();
            $table->timestamp('last_ping_at')->nullable();

            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->unsignedInteger('incidents_helped')->default(0);

            $table->json('unlocked_rewards')->nullable();
            $table->string('active_theme')->default('default');
            $table->string('active_font')->default('default');

            $table->timestamps();

            $table->index(['is_available', 'last_ping_at']);
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('volunteers');
    }
};
