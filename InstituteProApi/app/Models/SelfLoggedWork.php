<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SelfLoggedWork extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'work_title',
        'description',
        'time_spent_hours',
        'work_date',
        'attachment_path',
        'verification_status',
        'verified_by',
        'verification_notes',
        'verified_at',
    ];

    protected $casts = [
        'work_date' => 'date',
        'time_spent_hours' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function verifier()
    {
        return $this->belongsTo(Employee::class, 'verified_by');
    }

    // Methods
    public function getStatusLabel()
    {
        return match($this->verification_status) {
            'pending' => 'Pending Review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'Unknown',
        };
    }

    public function getStatusColor()
    {
        return match($this->verification_status) {
            'pending' => 'warning',
            'approved' => 'success',
            'rejected' => 'danger',
            default => 'secondary',
        };
    }

    public function isApproved()
    {
        return $this->verification_status === 'approved';
    }

    public function isPending()
    {
        return $this->verification_status === 'pending';
    }

    public function isRejected()
    {
        return $this->verification_status === 'rejected';
    }

    // Scopes
    public function scopeByEmployee($query, $employee_id)
    {
        return $query->where('employee_id', $employee_id);
    }

    public function scopeByDate($query, $date)
    {
        return $query->where('work_date', $date);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('work_date', [$from, $to]);
    }

    public function scopeApproved($query)
    {
        return $query->where('verification_status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('verification_status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }

    // Accessors
    public function getFormattedHoursAttribute()
    {
        return round($this->time_spent_hours, 1) . ' hours';
    }
}