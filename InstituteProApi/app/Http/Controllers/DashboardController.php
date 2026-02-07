<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Task;
use App\Models\Income;
use App\Models\Expense;
use App\Models\ActivityLog;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Financial Filter (Default: All Months)
        $finYear = $request->input('financial_year', Carbon::now()->year);
        $finMonth = $request->input('financial_month', 0);

        if ($finMonth == 0) {
            $finStart = Carbon::createFromDate($finYear, 1, 1)->startOfYear();
            $finEnd = Carbon::createFromDate($finYear, 1, 1)->endOfYear();
        } else {
            $finStart = Carbon::createFromDate($finYear, $finMonth, 1)->startOfMonth();
            $finEnd = Carbon::createFromDate($finYear, $finMonth, 1)->endOfMonth();
        }

        // Attendance Filter (Default: Current Month)
        $attYear = $request->input('attendance_year', Carbon::now()->year);
        $attMonth = $request->input('attendance_month', Carbon::now()->month);

        if ($attMonth == 0) {
            $attStart = Carbon::createFromDate($attYear, 1, 1)->startOfYear();
            $attEnd = Carbon::createFromDate($attYear, 1, 1)->endOfYear();
        } else {
            $attStart = Carbon::createFromDate($attYear, $attMonth, 1)->startOfMonth();
            $attEnd = Carbon::createFromDate($attYear, $attMonth, 1)->endOfMonth();
        }

        $today = Carbon::today();

        // Stats
        $totalStaff = Employee::where('status', 'active')->count();
        $presentToday = Attendance::whereDate('attendance_date', $today)
                                  ->whereIn('status', ['present', 'half_day', 'late'])
                                  ->count();
        $lateToday = Attendance::whereDate('attendance_date', $today)
                                  ->where('status', 'late')
                                  ->count();
        $pendingTasks = Task::whereNotIn('status', ['completed', 'cancelled'])->count();
        $monthExpenses = Expense::whereBetween('expense_date', [$finStart, $finEnd])
                                ->whereIn('status', ['approved', 'pending'])
                                ->sum('amount');

        $monthIncome = Income::whereBetween('income_date', [$finStart, $finEnd])
            ->sum('amount');

        // Recent Activity
        $recentActivities = ActivityLog::with(['actor:id,full_name'])
                                       ->latest()
                                       ->take(5)
                                       ->get()
                                       ->map(function ($log) {
                                           return [
                                               'id' => $log->id,
                                               'title' => $log->description,
                                               'time' => $log->created_at->diffForHumans(),
                                               'icon' => $this->getIconForActivity($log->action_type),
                                               'color' => $this->getColorForActivity($log->action_type),
                                               'user' => $log->actor ? $log->actor->full_name : 'System'
                                           ];
                                       });

        // Tasks List (Sorted by Priority: High > Medium > Low)
        $upcomingTasks = Task::with(['assignments.assignee'])
                             ->where('status', '!=', 'completed')
                             ->orderByRaw("CASE 
                                WHEN priority = 'high' THEN 1 
                                WHEN priority = 'medium' THEN 2 
                                WHEN priority = 'low' THEN 3 
                                ELSE 4 END")
                             ->orderBy('deadline', 'asc')
                             ->take(6)
                             ->get()
                             ->map(function ($task) {
                                 $assignee = $task->assignments->first()?->assignee;
                                 return [
                                     'id' => $task->id,
                                     'title' => $task->title,
                                     'assigned_to' => $assignee ? $assignee->full_name : 'Unassigned',
                                     'due' => Carbon::parse($task->deadline)->format('M d'),
                                     'priority' => ucfirst($task->priority),
                                     'status' => ucfirst(str_replace('_', ' ', $task->status))
                                 ];
                             });

        // Office Cash Holders
        $officeCashHolders = Employee::where('status', 'active')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'role' => ucfirst($employee->role),
                    'balance' => $employee->getCurrentFloatBalance()
                ];
            })
            ->filter(function ($holder) {
                return $holder['balance'] > 0;
            })
            ->values();

        // Month Attendance Summary
        $monthAttendance = Employee::where('status', 'active')
            ->get()
            ->map(function ($employee) use ($attStart, $attEnd) {
                $attendance = Attendance::where('employee_id', $employee->id)
                    ->whereBetween('attendance_date', [$attStart, $attEnd])
                    ->get();

                $late = $attendance->where('status', 'late')->count();
                $halfDay = $attendance->where('status', 'half_day')->count();
                $present = $attendance->where('status', 'present')->count();
                $absent = $attendance->where('status', 'absent')->count();
                
                // Total Present includes pure present + late + half_day
                $totalPresent = $present + $late + $halfDay;
                
                // Calculate Day/Night specific stats (Present/Late/Half Day count as present)
                $dayPresent = $attendance->where('shift_type', 'day')
                                         ->whereIn('status', ['present', 'late', 'half_day'])
                                         ->count();
                
                $nightPresent = $attendance->where('shift_type', 'night')
                                           ->whereIn('status', ['present', 'late', 'half_day'])
                                           ->count();
                
                // Calculate percentage based on unique days present vs total working days so far
                $presentDaysCount = $attendance->whereIn('status', ['present', 'late', 'half_day'])
                                            ->pluck('attendance_date')
                                            ->map(function($date) {
                                                return $date->format('Y-m-d');
                                            })
                                            ->unique()
                                            ->count();

                $today = Carbon::today();
                $effectiveEnd = $attEnd->lessThan($today) ? $attEnd : $today;
                
                if ($effectiveEnd->lessThan($attStart)) {
                    $totalDays = 0;
                } else {
                    $totalDays = $attStart->diffInDays($effectiveEnd) + 1;
                }

                $percentage = $totalDays > 0 ? round(($presentDaysCount / $totalDays) * 100) : 0;
                $percentage = min($percentage, 100); // Ensure it never exceeds 100%

                return [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'role' => ucfirst($employee->role),
                    'present' => $totalPresent,
                    'day_present' => $dayPresent,
                    'night_present' => $nightPresent,
                    'present_days' => $presentDaysCount,
                    'total_days' => $totalDays,
                    'late' => $late,
                    'half_day' => $halfDay,
                    'absent' => $absent,
                    'percentage' => $percentage
                ];
            });

        return response()->json([
            'stats' => [
                'total_staff' => $totalStaff,
                'present_today' => $presentToday,
                'late_today' => $lateToday,
                'pending_tasks' => $pendingTasks,
                'month_expenses' => round($monthExpenses),
                'month_income' => round($monthIncome)
            ],
            'recent_activities' => $recentActivities,
            'upcoming_tasks' => $upcomingTasks,
            'office_cash_holders' => $officeCashHolders,
            'month_attendance' => $monthAttendance
        ]);
    }

    private function getIconForActivity($action)
    {
        return match($action) {
            'check_in', 'login' => 'log-in',
            'check_out', 'logout' => 'log-out',
            'create' => 'plus-circle',
            'update' => 'edit',
            'delete' => 'trash',
            'approve', 'confirm' => 'check-circle',
            'reject' => 'x-circle',
            default => 'activity'
        };
    }

    private function getColorForActivity($action)
    {
        return match($action) {
            'login', 'check_in', 'create', 'approve', 'confirm' => '#10b981', // green
            'logout', 'check_out', 'reject', 'delete' => '#ef4444', // red
            'update' => '#3b82f6', // blue
            default => '#6b7280' // gray
        };
    }
}
