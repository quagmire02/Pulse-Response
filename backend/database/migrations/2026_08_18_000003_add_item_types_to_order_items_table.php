<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('medicine_id')->nullable()->change();

            $table->string('item_type')->default('medicine')->after('order_id');
            $table->foreignId('equipment_id')->nullable()->after('medicine_id')
                  ->constrained('equipment')->onDelete('cascade');
            $table->date('rental_start')->nullable();
            $table->date('rental_end')->nullable();
            // Snapshot of what was charged, so later price edits do not rewrite history.
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->decimal('line_total', 10, 2)->nullable();
        });

        DB::table('order_items')->update(['item_type' => 'medicine']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['equipment_id']);
            $table->dropColumn([
                'item_type',
                'equipment_id',
                'rental_start',
                'rental_end',
                'unit_price',
                'line_total',
            ]);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('medicine_id')->nullable(false)->change();
        });
    }
};
