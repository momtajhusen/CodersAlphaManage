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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('task_code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('medium'); // low, medium, high
            $table->string('category');
            $table->string('status')->default('new'); // new, assigned, in_progress, completed, cancelled, late
            $table->decimal('budget_required', 10, 2)->nullable();
            $table->decimal('budget_used', 10, 2)->default(0);
            $table->text('materials_needed')->nullable();
            $table->text('documents_needed')->nullable();
            $table->date('start_date')->nullable();
            $table->date('deadline');
            $table->dateTime('completed_date')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('employees')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
