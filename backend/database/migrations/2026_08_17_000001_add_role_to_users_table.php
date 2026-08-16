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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('is_super_admin');
        });

        $this->backfillRoles();
    }

    /**
     * Existing accounts predate the role column, so derive their role from the
     * profile tables and admin flags instead of leaving everyone as a customer.
     */
    private function backfillRoles(): void
    {
        // Most specific first: a later update would otherwise overwrite an earlier one.
        if (Schema::hasTable('pharmacists')) {
            DB::table('users')
                ->whereIn('id', DB::table('pharmacists')->select('user_id'))
                ->update(['role' => 'pharmacist']);
        }

        if (Schema::hasTable('vendors')) {
            DB::table('users')
                ->whereIn('id', DB::table('vendors')->select('user_id'))
                ->update(['role' => 'vendor']);
        }

        if (Schema::hasTable('ambulance_companies')) {
            DB::table('users')
                ->whereIn('id', DB::table('ambulance_companies')->select('user_id'))
                ->update(['role' => 'ambulance_company']);
        }

        DB::table('users')->where('is_admin', true)->update(['role' => 'admin']);
        DB::table('users')->where('is_super_admin', true)->update(['role' => 'super_admin']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
