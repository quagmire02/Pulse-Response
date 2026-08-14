<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category'); // e.g. oxygen, vaccine, mobility, monitoring
            $table->decimal('price_per_day', 10, 2);
            $table->string('size')->nullable();       // e.g. small, medium, large, or dimensions
            $table->integer('quantity')->default(0);
            $table->text('safety_rules')->nullable();
            $table->string('condition');              // new, good, fair
            $table->boolean('is_available')->default(true);
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
