<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['key' => 'institute_name', 'value' => 'Institute Pro', 'group' => 'general'],
            ['key' => 'currency', 'value' => 'INR', 'group' => 'general'],
            ['key' => 'attendance_start_time', 'value' => '08:00', 'group' => 'attendance'],
            ['key' => 'attendance_end_time', 'value' => '16:00', 'group' => 'attendance'],
            ['key' => 'grace_period_minutes', 'value' => '15', 'group' => 'attendance'],
            ['key' => 'weekend_days', 'value' => json_encode(['Sunday']), 'group' => 'attendance'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
