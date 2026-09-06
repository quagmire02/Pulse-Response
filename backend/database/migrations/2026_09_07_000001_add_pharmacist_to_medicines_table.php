<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->foreignId('pharmacist_id')
                ->nullable()
                ->after('id')
                ->constrained('pharmacist_profiles')
                ->nullOnDelete();
        });

        $profiles = DB::table('pharmacist_profiles')->pluck('id');

        if ($profiles->count() === 1) {
            DB::table('medicines')->update(['pharmacist_id' => $profiles->first()]);
        }
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropForeign(['pharmacist_id']);
            $table->dropColumn('pharmacist_id');
        });
    }
};
