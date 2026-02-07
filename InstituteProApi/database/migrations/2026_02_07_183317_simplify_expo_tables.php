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
        // 1. Add device_model to expo_tokens
        Schema::table('expo_tokens', function (Blueprint $table) {
            $table->string('device_model')->nullable()->after('value');
        });

        // 2. Drop expo_tickets table
        Schema::dropIfExists('expo_tickets');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert expo_tokens changes
        Schema::table('expo_tokens', function (Blueprint $table) {
            $table->dropColumn('device_model');
        });

        // 2. Re-create expo_tickets table (simplified version of original)
        Schema::create('expo_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_id')->unique();
            $table->string('token');
            $table->timestamps();
        });
    }
};
