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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('employee_code')->unique();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('mobile_number')->nullable();
            $table->string('role')->default('Staff'); // Teacher, Admin, Staff, Driver, Partner
            $table->string('salary_type')->default('Fixed'); // Fixed, Share Profit
            $table->decimal('monthly_salary', 10, 2)->default(0);
            $table->decimal('profit_share_percentage', 5, 2)->nullable();
            $table->string('profile_photo')->nullable();
            $table->text('address')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('ifsc_code')->nullable();
            $table->date('join_date')->nullable();
            $table->string('status')->default('active'); // active, inactive, suspended
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
