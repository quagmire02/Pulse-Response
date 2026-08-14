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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->bigInteger('track_num');
            $table->date('est_del_date')->nullable();
            $table->date('act_del_date')->nullable();
            $table->enum('delivery_status', ['processing', 'delivered', 'failed'])->default('processing');
            $table->enum('delivery_type', ['basic', 'rapid', 'emergency'])->default('basic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
