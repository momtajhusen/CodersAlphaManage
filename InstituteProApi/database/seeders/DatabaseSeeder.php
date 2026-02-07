<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            EmployeeSeeder::class,
            SettingsSeeder::class,
            TaskSeeder::class,
            AttendanceSeeder::class,
            FinanceSeeder::class,
        ]);
    }
}
