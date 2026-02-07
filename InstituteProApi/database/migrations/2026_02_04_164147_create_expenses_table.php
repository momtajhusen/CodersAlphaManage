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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade'); // Who spent/requested
            $table->string('expense_type'); // personal, institute
            $table->decimal('amount', 10, 2);
            $table->string('category'); // Food, Travel, etc
            $table->text('description')->nullable();
            $table->string('bill_photo_path')->nullable();
            $table->date('expense_date');
            $table->string('paid_from')->default('institute_float'); // personal_money, institute_float
            $table->foreignId('float_holder_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->foreignId('approved_by')->nullable()->constrained('employees')->onDelete('set null');
            $table->dateTime('approval_date')->nullable();
            $table->string('reimbursement_status')->default('pending'); // pending, reimbursed, cancelled
            $table->dateTime('reimbursement_date')->nullable();
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
        Schema::dropIfExists('expenses');
    }
};
