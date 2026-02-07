<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_code',
        'title',
        'description',
        'priority',
        'category',
        'status',
        'budget_required',
        'budget_used',
        'materials_needed',
        'documents_needed',
        'start_date',
        'deadline',
        'completed_date',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
        'completed_date' => 'datetime',
        'budget_required' => 'decimal:2',
        'budget_used' => 'decimal:2',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    // Methods
    public function getPriorityLabel()
    {
        return match($this->priority) {
            'low' => 'Low Priority',
            'medium' => 'Medium Priority',
            'high' => 'High Priority',
            default => 'Unknown',
        };
    }

    public function getStatusLabel()
    {
        return match($this->status) {
            'new' => 'New',
            'assigned' => 'Assigned',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            'late' => 'Late',
            default => 'Unknown',
        };
    }

    public function getStatusColor()
    {
        return match($this->status) {
            'new' => 'gray',
            'assigned' => 'blue',
            'in_progress' => 'yellow',
            'completed' => 'green',
            'cancelled' => 'black',
            'late' => 'red',
            default => 'secondary',
        };
    }

    public function isLate()
    {
        return Carbon::today() > $this->deadline && $this->status !== 'completed';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isOverdue()
    {
        return $this->deadline < Carbon::today() && $this->status !== 'completed';
    }

    public function getDaysUntilDeadline()
    {
        return Carbon::now()->diffInDays($this->deadline, false);
    }

    public function getProgress()
    {
        $assignments = $this->assignments()
            ->where('assignment_status', 'accepted')
            ->get();

        if ($assignments->isEmpty()) {
            return 0;
        }

        $totalProgress = $assignments->sum('progress_percentage');
        $count = $assignments->count();

        return round($totalProgress / $count, 0);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeOverdue($query)
    {
        return $query->where('deadline', '<', Carbon::today())
                    ->where('status', '!=', 'completed');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('deadline', '>=', Carbon::today())
                    ->where('status', '!=', 'completed')
                    ->orderBy('deadline', 'asc');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['new', 'assigned', 'in_progress']);
    }

    // Accessors
    public function getFormattedDeadlineAttribute()
    {
        return $this->deadline->format('d M Y');
    }

    public function getFormattedBudgetAttribute()
    {
        return 'Rs.' . number_format($this->budget_required, 2);
    }
}