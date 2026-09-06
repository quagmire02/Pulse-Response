<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacist_id')->constrained('pharmacists')->onDelete('cascade');
            $table->date('date');
            $table->integer('start_time');
            $table->integer('end_time');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('slots');
    }
};
