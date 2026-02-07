<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@institute.com',
            'password' => bcrypt('password'),
        ]);

        Employee::create([
            'user_id' => $adminUser->id,
            'employee_code' => 'EMP-ADMIN',
            'full_name' => $adminUser->name,
            'email' => $adminUser->email,
            'role' => 'Admin',
            'status' => 'active',
            'join_date' => now(),
        ]);

        // Teacher
        $teacherUser = User::create([
            'name' => 'Raj Kumar',
            'email' => 'raj@gmail.com',
            'password' => bcrypt('password'),
        ]);

        Employee::create([
            'user_id' => $teacherUser->id,
            'employee_code' => 'EMP-TEACHER',
            'full_name' => $teacherUser->name,
            'email' => $teacherUser->email,
            'role' => 'Teacher',
            'salary_type' => 'Fixed',
            'monthly_salary' => 15000,
            'status' => 'active',
            'join_date' => now(),
        ]);
    }
}
