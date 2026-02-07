<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Income extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'income_type',
        'source_type',
        'contributor_id',
        'held_by_id',
        'payment_method',
        'category',
        'amount',
        'description',
        'receipt_file_path',
        'income_date',
        'status',
        'confirmed_by',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'income_date' => 'date',
        'amount' => 'decimal:2',
    ];

    protected $appends = ['title'];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function contributor()
    {
        return $this->belongsTo(Employee::class, 'contributor_id');
    }

    public function heldBy()
    {
        return $this->belongsTo(Employee::class, 'held_by_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    public function confirmedBy()
    {
        return $this->belongsTo(Employee::class, 'confirmed_by');
    }

    // Methods
    public function getTitleAttribute()
    {
        return $this->category ?? $this->getTypeLabel();
    }

    public function getTypeLabel()
    {
        return match($this->income_type) {
            'salary' => 'Salary',
            'course_fee' => 'Course Fee',
            'personal_work' => 'Personal Work',
            'other' => 'Other Income',
            default => ucfirst($this->income_type),
        };
    }

    public function getStatusLabel()
    {
        return match($this->status) {
            'pending' => 'Pending Review',
            'confirmed' => 'Confirmed',
            'rejected' => 'Rejected',
            default => 'Unknown',
        };
    }

    public function isConfirmed()
    {
        return $this->status === 'confirmed';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->where('income_date', $date);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('income_date', [$from, $to]);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('income_type', $type);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByEmployee($query, $employee_id)
    {
        return $query->where('employee_id', $employee_id);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('income_date', [
            now()->startOfMonth(),
            now()->endOfMonth()
        ]);
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return 'Rs.' . number_format($this->amount, 2);
    }
}