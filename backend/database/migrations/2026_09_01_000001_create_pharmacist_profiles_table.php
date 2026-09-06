<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Pharmacists and doctors were sharing one table, which meant a pharmacist
     * could publish consultation slots and a doctor could edit the medicine
     * catalogue. They are now separate professions:
     *
     *   pharmacists          -> the doctor profile. Slots, consultations and
     *                           reviews already point here, so it keeps its
     *                           name and nothing has to be rewired.
     *   pharmacist_profiles  -> actual pharmacy staff, who manage medicines
     *                           and never take consultations.
     */
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

        // Anyone currently registered as a pharmacist is holding a doctor
        // profile. Move them across, then drop the doctor row so they lose the
        // consultation abilities they should never have had.
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

            // Cascades to that pharmacist's slots, consultations and reviews,
            // which is intended: they were never a doctor.
            DB::table('pharmacists')->where('user_id', $userId)->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacist_profiles');
    }
};
