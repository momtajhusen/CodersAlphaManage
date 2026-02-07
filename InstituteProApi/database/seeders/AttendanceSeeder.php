<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
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

        // Create attendance for last 5 days
        for ($i = 4; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            // Skip weekends if needed, but for simplicity we seed all
            Attendance::create([
                'employee_id' => $teacher->id,
                'attendance_date' => $date->format('Y-m-d'),
                'check_in_time' => $date->copy()->setTime(9, 0, 0),
                'check_out_time' => $date->copy()->setTime(17, 0, 0),
                'status' => 'present',
            ]);
        }
        
        // Add a check-in without check-out for today (simulating currently working)
        // Only if not already seeded by loop (loop includes today if i=0)
        // But let's overwrite today's record to be "checked in only" for testing check-out logic
        
        $todayAttendance = Attendance::where('employee_id', $teacher->id)
            ->where('attendance_date', Carbon::today()->format('Y-m-d'))
            ->first();

        if ($todayAttendance) {
            $todayAttendance->update([
                'check_out_time' => null,
            ]);
        }
    }
}
