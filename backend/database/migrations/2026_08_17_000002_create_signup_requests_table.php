<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
    {
        Schema::create('signup_requests', function (Blueprint $table) {
            $table->id();

            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email');
            $table->string('username');
            $table->string('address')->nullable();
            $table->string('password');
            $table->string('role')->default('user');

            $table->string('license_num')->nullable();
            $table->string('speciality')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('is_consultation')->default(false);

            $table->string('company_name')->nullable();
            $table->text('description')->nullable();
            $table->string('contact_phone')->nullable();

            $table->string('status')->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'role']);
        });
    }

        public function down(): void
    {
        Schema::dropIfExists('signup_requests');
    }
};
