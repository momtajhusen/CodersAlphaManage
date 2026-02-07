<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'assigned_to',
        'assigned_by',
        'assignment_status',
        'response_date',
        'progress_percentage',
        'actual_start_date',
        'expected_completion_date',
        'estimated_hours',
        'actual_hours',
        'notes',
    ];

    protected $casts = [
        'response_date' => 'datetime',
        'actual_start_date' => 'datetime',
        'expected_completion_date' => 'datetime',
        'estimated_hours' => 'decimal:2',
        'actual_hours' => 'decimal:2',
    ];

    // Relationships
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function assignee()
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function assigner()
    {
        return $this->belongsTo(Employee::class, 'assigned_by');
    }

    // Methods
    public function getStatusLabel()
    {
        return match($this->assignment_status) {
            'pending' => 'Pending',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            default => 'Unknown',
        };
    }

    public function isAccepted()
    {
        return $this->assignment_status === 'accepted';
    }

    public function isPending()
    {
        return $this->assignment_status === 'pending';
    }

    public function isRejected()
    {
        return $this->assignment_status === 'rejected';
    }

    public function getProgressPercentage()
    {
        return $this->progress_percentage ?? 0;
    }

    public function isCompleted()
    {
        return $this->progress_percentage >= 100;
    }

    public function getTimeWorked()
    {
        if (!$this->actual_hours) {
            return 'Not recorded';
        }

        return round($this->actual_hours, 1) . ' hours';
    }

    public function getEfficiency()
    {
        if (!$this->estimated_hours || !$this->actual_hours) {
            return 'N/A';
        }

        $efficiency = ($this->estimated_hours / $this->actual_hours) * 100;
        return round($efficiency, 2) . '%';
    }

    // Scopes
    public function scopeByTask($query, $task_id)
    {
        return $query->where('task_id', $task_id);
    }

    public function scopeByEmployee($query, $employee_id)
    {
        return $query->where('assigned_to', $employee_id);
    }

    public function scopeAccepted($query)
    {
        return $query->where('assignment_status', 'accepted');
    }

    public function scopePending($query)
    {
        return $query->where('assignment_status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('assignment_status', 'rejected');
    }

    public function scopeCompleted($query)
    {
        return $query->where('progress_percentage', 100);
    }

    public function scopeIncomplete($query)
    {
        return $query->where('progress_percentage', '<', 100);
    }
}