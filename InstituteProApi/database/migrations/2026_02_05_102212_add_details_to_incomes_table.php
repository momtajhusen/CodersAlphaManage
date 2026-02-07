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
        Schema::table('incomes', function (Blueprint $table) {
            $table->string('source_type')->default('institute')->after('income_type'); // institute, personal_project
            $table->foreignId('contributor_id')->nullable()->constrained('employees')->onDelete('set null')->after('source_type');
            $table->foreignId('held_by_id')->nullable()->constrained('employees')->onDelete('set null')->after('amount');
            $table->string('payment_method')->default('cash')->after('held_by_id'); // cash, bank_transfer, online, cheque
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropForeign(['contributor_id']);
            $table->dropForeign(['held_by_id']);
            $table->dropColumn(['source_type', 'contributor_id', 'held_by_id', 'payment_method']);
        });
    }
};
