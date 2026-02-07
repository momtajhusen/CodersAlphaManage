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
        Schema::create('self_logged_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('work_title');
            $table->text('description')->nullable();
            $table->decimal('time_spent_hours', 5, 2);
            $table->date('work_date');
            $table->string('attachment_path')->nullable();
            $table->string('verification_status')->default('pending'); // pending, approved, rejected
            $table->foreignId('verified_by')->nullable()->constrained('employees')->onDelete('set null');
            $table->text('verification_notes')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('self_logged_works');
    }
};
