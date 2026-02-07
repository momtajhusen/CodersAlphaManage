<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('attendance_mode')->default('direct_status')->after('status'); // direct_status, time_based
            $table->string('preferred_shift')->default('day')->after('attendance_mode'); // day, night, both
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['attendance_mode', 'preferred_shift']);
        });
    }
};
