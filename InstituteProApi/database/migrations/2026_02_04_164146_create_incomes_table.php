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
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained()->onDelete('set null');
            $table->string('income_type'); // salary, course_fee, personal_work, other
            $table->decimal('amount', 10, 2);
            $table->date('income_date');
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->string('receipt_file_path')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed, rejected
            $table->foreignId('confirmed_by')->nullable()->constrained('employees')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('employees')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
