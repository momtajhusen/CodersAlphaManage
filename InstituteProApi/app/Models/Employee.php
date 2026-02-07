<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_code',
        'full_name',
        'email',
        'mobile_number',
        'role',
        'salary_type',
        'monthly_salary',
        'profit_share_percentage',
        'profile_photo',
        'address',
        'bank_account_number',
        'bank_name',
        'ifsc_code',
        'join_date',
        'status',
        'attendance_mode',
        'preferred_shift',
    ];

    protected $casts = [
        'join_date' => 'date',
        'monthly_salary' => 'decimal:2',
        'profit_share_percentage' => 'decimal:2',
    ];

    protected $appends = ['profile_photo_url'];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function income()
    {
        return $this->hasMany(Income::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function floatLedger()
    {
        return $this->hasMany(FloatLedger::class);
    }

    public function taskAssignments()
    {
        return $this->hasMany(TaskAssignment::class, 'assigned_to');
    }

    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function selfLoggedWork()
    {
        return $this->hasMany(SelfLoggedWork::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'actor_id');
    }

    public function approvedIncomes()
    {
        return $this->hasMany(Income::class, 'confirmed_by');
    }

    public function approvedExpenses()
    {
        return $this->hasMany(Expense::class, 'approved_by');
    }

    public function verifiedWork()
    {
        return $this->hasMany(SelfLoggedWork::class, 'verified_by');
    }

    // Methods
    public function getCurrentFloatBalance()
    {
        $lastLedger = $this->floatLedger()
            ->orderBy('id', 'desc')
            ->first();

        return $lastLedger->new_balance ?? 0;
    }

    public function getTotalSalaryThisMonth()
    {
        $income = $this->income()
            ->where('income_type', 'salary')
            ->where('status', 'confirmed')
            ->whereBetween('income_date', [
                now()->startOfMonth(),
                now()->endOfMonth()
            ])
            ->sum('amount');

        return $income;
    }

    public function getMonthlyAttendance($month = null, $year = null)
    {
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        return $this->attendance()
            ->whereYear('attendance_date', $year)
            ->whereMonth('attendance_date', $month)
            ->get();
    }

    public function getAttendanceStats($month = null, $year = null)
    {
        $records = $this->getMonthlyAttendance($month, $year);

        return [
            'total_days' => $records->count(),
            'present' => $records->where('check_in_time', '!=', null)->count(),
            'absent' => $records->where('leave_type', 'absent')->count(),
            'late' => $records->where('is_late', true)->count(),
            'on_leave' => $records->where('leave_type', '!=', 'none')->count(),
            'percentage' => $records->count() > 0 
                ? round(($records->where('check_in_time', '!=', null)->count() / $records->count()) * 100, 2)
                : 0,
        ];
    }

    public function getTaskCompletionRate()
    {
        $assignments = $this->taskAssignments()
            ->where('assignment_status', 'accepted')
            ->get();

        if ($assignments->isEmpty()) {
            return 0;
        }

        $completed = $assignments->whereIn('progress_percentage', [100])->count();
        
        return round(($completed / $assignments->count()) * 100, 2);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
    }

    // Mutators
    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo ? url('storage/' . $this->profile_photo) : null;
    }

    public function setProfilePhotoAttribute($value)
    {
        if (request()->hasFile('profile_photo')) {
            $path = request()->file('profile_photo')->store('profile-photos', 'public');
            $this->attributes['profile_photo'] = $path;
        } else {
            $this->attributes['profile_photo'] = $value;
        }
    }
}