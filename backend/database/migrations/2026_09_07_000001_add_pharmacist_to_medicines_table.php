<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Gives every medicine an owning pharmacist.
 *
 * Without this the catalogue was shared, so two pharmacists saw identical
 * sales figures and could edit each other's listings. Nullable rather than
 * required: medicines created by an admin belong to the platform, and the
 * existing catalogue has no owner to assign.
 *
 * On delete the column is nulled rather than cascaded. Removing a pharmacist
 * should not silently delete the medicines patients have already ordered.
 */
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

        // A single pharmacist on the platform is the obvious owner of what is
        // already there; with none or several, leave it unassigned for an admin
        // to sort out rather than guessing.
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
