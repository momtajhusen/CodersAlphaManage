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
        Schema::table('float_ledgers', function (Blueprint $table) {
            $table->renameColumn('balance_after', 'new_balance');
            $table->decimal('previous_balance', 10, 2)->after('amount')->default(0);
            $table->string('reference_type')->nullable()->after('new_balance');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
            $table->foreignId('created_by')->nullable()->constrained('employees')->onDelete('set null')->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('float_ledgers', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['previous_balance', 'reference_type', 'reference_id', 'created_by']);
            $table->renameColumn('new_balance', 'balance_after');
        });
    }
};
