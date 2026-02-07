<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\Employee;
use App\Models\TaskAssignment;
use App\Models\SelfLoggedWork;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teacher = Employee::where('role', 'Teacher')->first();

        if (!$teacher) {
            return;
        }

        // Create Tasks
        $tasks = [
            [
                'task_code' => 'TASK-001',
                'title' => 'Prepare Math Lesson Plan',
                'description' => 'Prepare lesson plan for Algebra chapter 5.',
                'start_date' => Carbon::now(),
                'deadline' => Carbon::now()->addDays(2),
                'status' => 'pending',
                'priority' => 'high',
                'category' => 'Academic',
                'created_by' => 1,
            ],
            [
                'task_code' => 'TASK-002',
                'title' => 'Grade Science Papers',
                'description' => 'Grade the recent science test papers for class 10.',
                'start_date' => Carbon::now(),
                'deadline' => Carbon::now()->addDays(1),
                'status' => 'pending',
                'priority' => 'medium',
                'category' => 'Academic',
                'created_by' => 1,
            ],
            [
                'task_code' => 'TASK-003',
                'title' => 'Update Student Attendance Records',
                'description' => 'Ensure all attendance records for the month are up to date.',
                'start_date' => Carbon::now()->subDays(2),
                'deadline' => Carbon::now()->subDays(1), // Overdue
                'status' => 'pending', // Should trigger overdue logic if checked
                'priority' => 'low',
                'category' => 'Administrative',
                'created_by' => 1,
            ],
        ];

        foreach ($tasks as $taskData) {
            $task = Task::create($taskData);

            // Assign to teacher
            TaskAssignment::create([
                'task_id' => $task->id,
                'assigned_to' => $teacher->id,
                'assigned_by' => 1, // Admin ID usually 1
                'assignment_status' => 'pending',
            ]);
        }

        // Create Self Logged Work
        SelfLoggedWork::create([
            'employee_id' => $teacher->id,
            'work_title' => 'Extra Class for Weak Students',
            'description' => 'Took an extra class for students struggling with Geometry.',
            'time_spent_hours' => 1.0,
            'work_date' => Carbon::yesterday(),
            'verification_status' => 'pending',
        ]);
    }
}
