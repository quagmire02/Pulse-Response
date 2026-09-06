<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('pharmacist_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('license_num');
            $table->string('pharmacy_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps();
        });

        $pharmacistUserIds = DB::table('users')->where('role', 'pharmacist')->pluck('id');

        foreach ($pharmacistUserIds as $userId) {
            $doctorRow = DB::table('pharmacists')->where('user_id', $userId)->first();

            DB::table('pharmacist_profiles')->insert([
                'user_id' => $userId,
                'license_num' => (string) ($doctorRow->license_num ?? 'PENDING'),
                'bio' => $doctorRow->bio ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('pharmacists')->where('user_id', $userId)->delete();
        }
    }

        public function down(): void
    {
        Schema::dropIfExists('pharmacist_profiles');
    }
};
