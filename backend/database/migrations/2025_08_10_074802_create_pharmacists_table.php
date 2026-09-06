<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('pharmacists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('license_num');
            $table->string('speciality');
            $table->text('bio');
            $table->boolean('is_consultation');
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('pharmacists');
    }
};
