<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Mail;
use App\Mail\LeaveStatusEmail;
use Illuminate\Support\Facades\Log;
use App\Notifications\AttendanceUpdated;

class AttendanceController extends Controller
{
    use LogsActivity;

    /**
     * Helper to safely get current employee
     */
    private function getResolvedEmployee()
    {
        $user = Auth::user();
        if (!$user) return null;

        // Try direct relation
        // $user->employee uses the relationship which respects soft deletes by default.
        // So we should do manual lookup.

        $employee = \App\Models\Employee::where('user_id', $user->id)->first();
        if ($employee) return $employee;

        // Try email match
        if ($user->email) {
            return \App\Models\Employee::where('email', $user->email)->first();
        }

        return null;
    }

    /**
     * Get all attendance records
     */
    public function index(Request $request)
    {
        try {
            $query = Attendance::query();
            $currentUserEmployee = $this->getResolvedEmployee();

            // Filters
            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            } 
            // If no explicit employee_id, apply scoping logic
            else {
                if (!$currentUserEmployee) {
                    // If user has no employee record, return empty result with correct structure
                    $per_page = $request->per_page ?? 20;
                    $attendance = Attendance::whereRaw('1 = 0')->paginate($per_page);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $attendance
                    ]);
                }

                // If not Admin/Manager/Partner, restrict to self
                // Assuming roles: 'admin', 'manager', 'principal', 'partner' can see all
                if (!in_array(strtolower($currentUserEmployee->role), ['admin', 'manager', 'principal', 'partner'])) {
                    $query->where('employee_id', $currentUserEmployee->id);
                }
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('attendance_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->shift_type) {
                $query->where('shift_type', $request->shift_type);
            }

            $query->orderBy('attendance_date', 'desc');

            $per_page = $request->per_page ?? 20;
            // Cap per_page
            if ($per_page > 50) $per_page = 50;
            
            $attendance = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to calculate monthly attendance percentage
     */
    private function calculateMonthlyAttendance($employee_id, $date = null)
    {
        $targetDate = $date ? Carbon::parse($date) : Carbon::today();
        $startOfMonth = $targetDate->copy()->startOfMonth();
        
        // Count total days passed in month including today
        $totalDays = $targetDate->day;
        
        // Count Present days
        $presentDays = Attendance::where('employee_id', $employee_id)
            ->whereBetween('attendance_date', [$startOfMonth->format('Y-m-d'), $targetDate->format('Y-m-d')])
            ->where('status', 'present')
            ->count();
            
        if ($totalDays > 0) {
            return round(($presentDays / $totalDays) * 100, 1);
        }
        return 0;
    }

    /**
     * Helper to get notification details based on status and shift
     */
    private function getNotificationDetails($status, $shift_type, $employeeName, $date, $percentage)
    {
        $shiftLabel = ucfirst($shift_type); // Day or Night
        $dateStr = Carbon::parse($date)->format('d M, Y');
        
        // Shift Emoji
        $shiftEmoji = $shift_type === 'day' ? '☀️' : '🌙';

        // Status Emoji
        if ($status === 'present') {
            $statusEmoji = '✅ ';
        } elseif ($status === 'absent') {
            $statusEmoji = '❌ ';
        } elseif ($status === 'late') {
            $statusEmoji = '⚠️ ';
        } else {
            $statusEmoji = '📝 ';
        }
        
        $statusLabel = ucfirst($status);
        
        $title = "{$shiftEmoji} {$shiftLabel} Attendance: {$statusEmoji}{$statusLabel}";
        $body = "Hello {$employeeName}, your attendance for {$dateStr} has been marked as {$statusLabel}.\n\n📊 This Month Attendance: {$percentage}%";
        
        return ['title' => $title, 'body' => $body];
    }

    /**
     * Mark check-in
     */
    public function checkIn(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $currentUserEmployee = $this->getResolvedEmployee();

            // Allow admin/manager to check in for others, or default to self
            if ($request->employee_id) {
                $employee_id = $request->employee_id;
            } else {
                if (!$currentUserEmployee) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No employee record found for this user.'
                    ], 404);
                }
                $employee_id = $currentUserEmployee->id;
            }

            $today = $request->date ? Carbon::parse($request->date) : Carbon::today();
            $shift_type = $request->shift_type;

            // Check if already checked in for this shift
            $existing = Attendance::where('employee_id', $employee_id)
                ->where('attendance_date', $today->format('Y-m-d'))
                ->where('shift_type', $shift_type)
                ->first();

            if ($existing) {
                // If checking in again with same status, return success (idempotent)
                if ($request->status && $existing->status === $request->status) {
                    return response()->json([
                        'success' => true,
                        'message' => "Attendance already marked as {$request->status}",
                        'data' => $existing
                    ]);
                }
                
                // If trying to change status, update instead of fail
                if ($request->status && $existing->status !== $request->status) {
                    $existing->update([
                        'status' => $request->status,
                        'check_in_time' => Carbon::now()->format('H:i:s'), // Update time if status changes
                        'notes' => $request->notes ?? $existing->notes
                    ]);

                    // Send notification for status update
                    $targetEmployee = \App\Models\Employee::find($employee_id);
                    $employeeName = $targetEmployee ? $targetEmployee->full_name : 'Employee';
                    $targetUser = $targetEmployee ? $targetEmployee->user : null;
                    if (!$targetUser && $targetEmployee && $targetEmployee->user_id) {
                         $targetUser = \App\Models\User::find($targetEmployee->user_id);
                    }
                    
                    // Calculate Percentage
                    $percentage = $this->calculateMonthlyAttendance($employee_id, $today);
                    $notifDetails = $this->getNotificationDetails($request->status, $shift_type, $employeeName, $today, $percentage);

                    // Create DB Notification for the user
                    try {
                        \App\Models\Notification::create([
                            'user_id' => $targetUser ? $targetUser->id : 1,
                            'title' => $notifDetails['title'],
                            'message' => $notifDetails['body'],
                            'type' => 'attendance',
                            'reference_type' => 'attendance',
                            'reference_id' => $existing->id,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('DB Notification Error: ' . $e->getMessage());
                    }

                    if ($targetUser) {
                        // Send Expo push to the user
                        try {
                            $targetUser->notify(new AttendanceUpdated(
                                $notifDetails['title'],
                                $notifDetails['body'],
                                [
                                    'type' => 'attendance',
                                    'attendance_id' => $existing->id,
                                    'date' => $today->format('Y-m-d'),
                                    'new_status' => $request->status,
                                    'shift' => $shift_type,
                                    'percentage' => $percentage
                                ]
                            ));
                        } catch (\Exception $e) {
                            Log::error('Attendance Update Notification Failed: ' . $e->getMessage());
                        }
                    }
                    
                    return response()->json([
                        'success' => true,
                        'message' => "Attendance updated to {$request->status}",
                        'data' => $existing
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => "Attendance already marked for this shift ({$shift_type})",
                    'data' => $existing // Return existing record so frontend can handle it
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'shift_type' => 'required|in:day,night,both',
                'status' => 'nullable|in:present,absent,late',
                'date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $current_time = Carbon::now();
            $status = $request->status ?? 'present';
            
            // Get shift settings
            $day_start_str = \App\Models\Setting::get('attendance_start_time', '08:00');
            $day_start = Carbon::createFromFormat('H:i', $day_start_str);
            $grace_period = (int) \App\Models\Setting::get('grace_period_minutes', 15);

            // Check if late (current time > start time + grace period)
            // We need to set the date part of day_start to today to compare correctly
            $day_start->setDate($today->year, $today->month, $today->day);
            
            if ($request->date && Carbon::parse($request->date)->ne(Carbon::today())) {
                $is_late = false;
            } else {
                $is_late = $current_time->gt($day_start) && $current_time->diffInMinutes($day_start) > $grace_period;
            }

            // If explicitly marking 'absent', ignore time and late status
            if ($status === 'absent') {
                $check_in_time = null;
                $is_late = false;
                $late_minutes = 0;
            } else {
                // If status is present (default) or late
                $check_in_time = $current_time->format('H:i:s');
                // If status is explicitly passed as 'late', force is_late
                if ($status === 'late') {
                    $is_late = true;
                }
                $late_minutes = $is_late ? $current_time->diffInMinutes($day_start) : 0;
            }

            $attendance = Attendance::create([
                'employee_id' => $employee_id,
                'attendance_date' => $today,
                'shift_type' => $shift_type,
                'check_in_time' => $check_in_time,
                'is_late' => $is_late,
                'late_minutes' => $late_minutes,
                'status' => $status,
            ]);

            // Log activity
            $this->logActivity('check_in', 'attendance', $attendance->id, 
                null, 
                ['check_in_time' => $check_in_time, 'status' => $status, 'shift' => $shift_type]
            );

            // Send notification to user
            $targetEmployee = \App\Models\Employee::find($employee_id);
            $employeeName = $targetEmployee ? $targetEmployee->full_name : 'Employee';
            $targetUser = $targetEmployee ? $targetEmployee->user : null;
            if (!$targetUser && $targetEmployee && $targetEmployee->user_id) {
                 $targetUser = \App\Models\User::find($targetEmployee->user_id);
            }
            
            // Calculate Percentage
            $percentage = $this->calculateMonthlyAttendance($employee_id, $today);
            $notifDetails = $this->getNotificationDetails($status, $shift_type, $employeeName, $today, $percentage);

            // Create DB Notification for the user
            try {
                \App\Models\Notification::create([
                    'user_id' => $targetUser ? $targetUser->id : 1,
                    'title' => $notifDetails['title'],
                    'message' => $notifDetails['body'],
                    'type' => 'attendance',
                    'reference_type' => 'attendance',
                    'reference_id' => $attendance->id,
                ]);
            } catch (\Exception $e) {
                Log::error('DB Notification Error: ' . $e->getMessage());
            }

            if ($targetUser) {
                // Send Expo push to the user (regular check-in notification)
                $targetUser->notify(new AttendanceUpdated(
                    $notifDetails['title'],
                    $notifDetails['body'],
                    [
                        'type' => 'attendance',
                        'attendance_id' => $attendance->id,
                        'date' => $today->format('Y-m-d'),
                        'shift' => $shift_type,
                        'percentage' => $percentage
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Check-in successful',
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark check-out
     */
    public function checkOut(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            if ($request->employee_id) {
                $employee_id = $request->employee_id;
            } else {
                $currentUserEmployee = $this->getResolvedEmployee();
                if (!$currentUserEmployee) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No employee record found for this user.'
                    ], 404);
                }
                $employee_id = $currentUserEmployee->id;
            }

            // Find the active check-in session (latest record with check_in but no check_out)
            /** @var \App\Models\Attendance|null $attendance */
            $attendance = Attendance::where('employee_id', $employee_id)
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->orderBy('attendance_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$attendance) {
                // Fallback to check if they already checked out today
                $today = Carbon::today();
                $alreadyCheckedOut = Attendance::where('employee_id', $employee_id)
                   ->where('attendance_date', $today)
                   ->whereNotNull('check_out_time')
                   ->exists();
                
                if ($alreadyCheckedOut) {
                   return response()->json([
                       'success' => false,
                       'message' => 'Already checked out today'
                   ], 422);
                }

               return response()->json([
                   'success' => false,
                   'message' => 'No active check-in found'
               ], 404);
            }

            $current_time = Carbon::now();
            
            // Parse check-in datetime correctly combining date and time
            $check_in_datetime = Carbon::parse($attendance->attendance_date->format('Y-m-d') . ' ' . $attendance->check_in_time);
            
            $hours_worked = $current_time->diffInHours($check_in_datetime);

            $attendance->update([
                'check_out_time' => $current_time->format('H:i:s'),
                // Status remains as is (usually 'pending') until approved by manager
            ]);

            // Log activity
            $this->logActivity('check_out', 'attendance', $attendance->id, 
                null, 
                ['check_out_time' => $current_time, 'hours_worked' => $hours_worked]
            );

            return response()->json([
                'success' => true,
                'message' => 'Check-out successful',
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create attendance record
     */
    public function store(\App\Http\Requests\StoreAttendanceRequest $request)
    {
        try {
            $attendance = Attendance::create([
                'employee_id' => $request->employee_id,
                'attendance_date' => $request->attendance_date,
                'shift_type' => $request->shift_type,
                'check_in_time' => $request->check_in_time,
                'check_out_time' => $request->check_out_time,
                'leave_type' => $request->leave_type ?? 'none',
                'status' => $request->status ?? 'pending',
            ]);

            // Log activity
            $this->logActivity('create', 'attendance', $attendance->id, 
                null, 
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance record created',
                'data' => $attendance
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance details
     */
    public function show($id)
    {
        try {
            $attendance = Attendance::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found'
            ], 404);
        }
    }

    /**
     * Update attendance
     */
    public function update(\App\Http\Requests\UpdateAttendanceRequest $request, $id)
    {
        try {
            $attendance = Attendance::findOrFail($id);

            $old_values = $attendance->toArray();
            $attendance->update($request->validated());

            // Send Notification/Email if status changes
            if (isset($request->status) && $request->status !== $old_values['status']) {
                $employee = $attendance->employee;
                
                // If it is a LEAVE (not regular and not absent), send Email
                if ($attendance->leave_type !== 'none' && $attendance->leave_type !== 'absent') {
                    try {
                        if ($employee && $employee->user && $employee->user->email) {
                            // Use user email primarily, fallback to employee email field if exists
                            $email = $employee->user->email;
                        } elseif ($employee && $employee->email) {
                            $email = $employee->email;
                        }

                        if (isset($email)) {
                            $details = [
                                'name' => $employee->full_name,
                                'status' => $attendance->status,
                                'type' => $attendance->leave_type !== 'none' ? $attendance->leave_type : 'Attendance',
                                'date' => $attendance->attendance_date->format('d M, Y'),
                                'approver' => Auth::user()->name,
                                'remarks' => $attendance->notes
                            ];
                            
                            // Mail::to($email)->send(new LeaveStatusEmail($details));
                            $this->sendNotification(
                                'Leave Status Updated',
                                $employee->full_name . "'s leave " . $attendance->status . " by " . Auth::user()->name,
                                'attendance'
                            );
                        }
                    } catch (\Exception $e) {
                        Log::error('Attendance/Leave Status Email Failed: ' . $e->getMessage());
                    }
                } 
                // For Regular Attendance or Absent: Send Expo Notification
                else {
                    try {
                        // Calculate Percentage
                        $percentage = $this->calculateMonthlyAttendance($employee->id, $attendance->attendance_date);
                        $notifDetails = $this->getNotificationDetails($request->status, $attendance->shift_type, $employee->full_name, $attendance->attendance_date, $percentage);

                        // Save to DB
                        try {
                            \App\Models\Notification::create([
                                'user_id' => ($employee && $employee->user) ? $employee->user->id : 1,
                                'title' => $notifDetails['title'],
                                'message' => $notifDetails['body'],
                                'type' => 'attendance',
                                'reference_type' => 'attendance',
                                'reference_id' => $attendance->id,
                            ]);
                        } catch (\Exception $e) {
                            Log::error('DB Notification Error: ' . $e->getMessage());
                        }

                        // Send to the user specifically
                        if ($employee && $employee->user) {
                            $employee->user->notify(new AttendanceUpdated(
                                $notifDetails['title'],
                                $notifDetails['body'],
                                [
                                    'type' => 'attendance',
                                    'attendance_id' => $attendance->id,
                                    'date' => $attendance->attendance_date->format('Y-m-d'),
                                    'new_status' => $request->status,
                                    'shift' => $attendance->shift_type,
                                    'percentage' => $percentage
                                ]
                            ));
                        }
                    } catch (\Exception $e) {
                        Log::error('Attendance Update Notification Failed: ' . $e->getMessage());
                    }
                }
            }

            // Log activity
            $this->logActivity('update', 'attendance', $id, 
                $old_values, 
                $attendance->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance updated successfully',
                'data' => $attendance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete attendance record
     */
    public function destroy($id)
    {
        try {
            $attendance = Attendance::findOrFail($id);
            
            $attendance->delete();

            // Log activity
            $this->logActivity('delete', 'attendance', $id, 
                $attendance->toArray(), 
                null
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance record deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get master attendance report (Grid View)
     */
    public function masterReport(Request $request)
    {
        try {
            $month = $request->month ?? Carbon::now()->month;
            $year = $request->year ?? Carbon::now()->year;
            
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

            // Get all employees
            $employees = \App\Models\Employee::select('id', 'full_name')
                ->orderBy('full_name')
                ->get();

            // Get all attendances in range
            $attendances = Attendance::whereBetween('attendance_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                ->get()
                ->groupBy('employee_id');

            // Generate dates array
            $dates = [];
            $current = $startDate->copy();
            while ($current->lte($endDate)) {
                $dates[] = [
                    'date' => $current->format('Y-m-d'),
                    'day' => $current->format('D'), // Mon, Tue...
                    'day_number' => $current->day
                ];
                $current->addDay();
            }

            // Build grid data
            $grid = $employees->map(function ($employee) use ($attendances, $dates) {
                $empRecords = $attendances->get($employee->id, collect());
                $recordsByDate = [];

                foreach ($dates as $dateInfo) {
                    $dateStr = $dateInfo['date'];
                    // Find records for this date
                    $dayRecord = $empRecords->where('attendance_date', $dateStr)->where('shift_type', 'day')->first();
                    $nightRecord = $empRecords->where('attendance_date', $dateStr)->where('shift_type', 'night')->first();

                    $recordsByDate[$dateStr] = [
                        'day' => $dayRecord ? ($dayRecord->status === 'present' ? 'P' : ($dayRecord->status === 'absent' ? 'A' : 'L')) : '-',
                        'night' => $nightRecord ? ($nightRecord->status === 'present' ? 'P' : ($nightRecord->status === 'absent' ? 'A' : 'L')) : '-',
                        'day_id' => $dayRecord ? $dayRecord->id : null,
                        'night_id' => $nightRecord ? $nightRecord->id : null,
                    ];
                }

                return [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'records' => $recordsByDate
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'month_name' => $startDate->format('F Y'),
                    'dates' => $dates,
                    'employees' => $grid
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get annual attendance report
     */
    public function annualReport(Request $request)
    {
        try {
            $employee_id = $request->employee_id;
            if (!$employee_id) {
                $currentUserEmployee = $this->getResolvedEmployee();
                $employee_id = $currentUserEmployee?->id;
            }
            $year = $request->year ?? Carbon::now()->year;

            $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfYear();

            if (!$employee_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'year' => $year,
                        'monthly_data' => collect(range(1, 12))->map(function ($i) {
                            return [
                                'month' => $i,
                                'month_name' => Carbon::create()->month($i)->format('M'),
                                'present' => 0,
                                'absent' => 0,
                                'late' => 0,
                                'total_records' => 0,
                            ];
                        })->values()
                    ]
                ]);
            }

            $attendances = Attendance::where('employee_id', $employee_id)
                ->whereBetween('attendance_date', [$startDate, $endDate])
                ->get();

            $monthlyData = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthName = Carbon::create()->month($i)->format('M');
                
                $monthAttendances = $attendances->filter(function ($att) use ($i) {
                    return $att->attendance_date->month === $i;
                });

                $present = $monthAttendances->filter(function ($att) {
                    return in_array(strtolower($att->status), ['present', 'late']) || ($att->check_in_time !== null);
                })->count();

                $absent = $monthAttendances->where('status', 'absent')->count();
                $late = $monthAttendances->where('is_late', true)->count();
                
                $monthlyData[] = [
                    'month' => $i,
                    'month_name' => $monthName,
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'total_records' => $monthAttendances->count() 
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'year' => $year,
                    'monthly_data' => $monthlyData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monthly attendance report
     */
    public function monthlyReport(Request $request)
    {
        try {
            $employee_id = $request->employee_id;
            if (!$employee_id) {
                $currentUserEmployee = $this->getResolvedEmployee();
                $employee_id = $currentUserEmployee?->id;
            }
            $month = $request->month ?? Carbon::now()->month;
            $year = $request->year ?? Carbon::now()->year;

            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

            if (!$employee_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'month' => $month,
                        'year' => $year,
                        'total_working_days' => 22,
                        'present_days' => 0,
                        'absent_days' => 0,
                        'late_days' => 0,
                        'avg_working_hours' => 0,
                        'attendance_percentage' => 0,
                        'daily_records' => []
                    ]
                ]);
            }

            $attendances = Attendance::where('employee_id', $employee_id)
                ->whereBetween('attendance_date', [$startDate, $endDate])
                ->get();

            // Calculate stats
            $present_count = $attendances->filter(function ($att) {
                return in_array(strtolower($att->status), ['present', 'late']) || ($att->check_in_time !== null);
            })->count();
            
            $late_days = $attendances->where('is_late', true)->count();
            $absent_days = $attendances->where('status', 'absent')->count();

            // Calculate hours
            $total_hours = 0;
            $days_with_hours = 0;
            
            foreach ($attendances as $att) {
                if ($att->check_in_time && $att->check_out_time) {
                    $in = Carbon::parse($att->check_in_time);
                    $out = Carbon::parse($att->check_out_time);
                    $total_hours += $out->diffInHours($in);
                    $days_with_hours++;
                }
            }

            $avg_working_hours = $days_with_hours > 0 ? $total_hours / $days_with_hours : 0;
            $estimated_working_days = 22; // Placeholder
            $attendance_percentage = ($estimated_working_days > 0) ? ($present_count / $estimated_working_days) * 100 : 0;

            // Prepare daily records
            $daily_records = $attendances->map(function ($att) {
                return [
                    'id' => $att->id,
                    'date' => $att->attendance_date->format('Y-m-d'),
                    'status' => $att->status,
                    'check_in' => $att->check_in_time ? Carbon::parse($att->check_in_time)->format('H:i') : '-',
                    'check_out' => $att->check_out_time ? Carbon::parse($att->check_out_time)->format('H:i') : '-',
                    'is_late' => $att->is_late,
                    'shift' => $att->shift_type,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'month' => $month,
                    'year' => $year,
                    'total_working_days' => $estimated_working_days,
                    'present_days' => $present_count,
                    'absent_days' => $absent_days,
                    'late_days' => $late_days,
                    'avg_working_hours' => round($avg_working_hours, 1),
                    'attendance_percentage' => round($attendance_percentage, 1),
                    'daily_records' => $daily_records
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
