<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * @property int $id
 * @property int $employee_id
 * @property \Illuminate\Support\Carbon $attendance_date
 * @property string $shift_type
 * @property string|null $check_in_time
 * @property string|null $check_out_time
 * @property bool $is_late
 * @property int|null $late_minutes
 * @property string|null $leave_type
 * @property string|null $leave_reason
 * @property int|null $approved_by
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Employee $employee
 * @property-read \App\Models\Employee|null $approver
 */
class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'attendance_date',
        'shift_type',
        'check_in_time',
        'check_out_time',
        'is_late',
        'late_minutes',
        'leave_type',
        'leave_reason',
        'approved_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'is_late' => 'boolean',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(Employee::class, 'approved_by');
    }

    // Methods
    public function getHoursWorked()
    {
        if (!$this->check_in_time || !$this->check_out_time) {
            return null;
        }

        $checkin = Carbon::createFromFormat('H:i:s', $this->check_in_time);
        $checkout = Carbon::createFromFormat('H:i:s', $this->check_out_time);

        return round($checkout->diffInMinutes($checkin) / 60, 2);
    }

    public function isLate()
    {
        return $this->is_late;
    }

    public function isPresent()
    {
        return $this->check_in_time !== null && $this->leave_type === 'none';
    }

    public function isAbsent()
    {
        return $this->leave_type === 'absent';
    }

    public function isOnLeave()
    {
        return $this->leave_type !== 'none' && $this->leave_type !== 'absent';
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->where('attendance_date', $date);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('attendance_date', [$from, $to]);
    }

    public function scopeByEmployee($query, $employee_id)
    {
        return $query->where('employee_id', $employee_id);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeLate($query)
    {
        return $query->where('is_late', true);
    }

    public function scopePresent($query)
    {
        return $query->where('check_in_time', '!=', null)
                    ->where('leave_type', 'none');
    }

    public function scopeAbsent($query)
    {
        return $query->where('leave_type', 'absent');
    }

    public function scopeOnLeave($query)
    {
        return $query->where('leave_type', '!=', 'none')
                    ->where('leave_type', '!=', 'absent');
    }

    // Accessors
    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            default => 'secondary',
        };
    }
}