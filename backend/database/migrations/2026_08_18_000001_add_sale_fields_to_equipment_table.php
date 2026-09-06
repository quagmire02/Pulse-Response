<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->decimal('sale_price', 10, 2)->nullable()->after('price_per_day');
            $table->boolean('is_for_rent')->default(true)->after('is_available');
            $table->boolean('is_for_sale')->default(false)->after('is_for_rent');
        });

        DB::table('equipment')->update([
            'is_for_rent' => true,
            'is_for_sale' => false,
        ]);
    }

        public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn(['sale_price', 'is_for_rent', 'is_for_sale']);
        });
    }
};
