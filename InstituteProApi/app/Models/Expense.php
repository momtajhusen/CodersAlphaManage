<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'expense_type',
        'category',
        'amount',
        'description',
        'bill_photo_path',
        'expense_date',
        'paid_from',
        'float_holder_id',
        'status',
        'approved_by',
        'approval_date',
        'reimbursement_status',
        'reimbursement_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'approval_date' => 'datetime',
        'reimbursement_date' => 'datetime',
    ];

    protected $appends = ['title'];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver()
    {
        return $this->belongsTo(Employee::class, 'approved_by');
    }

    public function floatHolder()
    {
        return $this->belongsTo(Employee::class, 'float_holder_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    // Methods
    public function getTitleAttribute()
    {
        return $this->category ?? $this->getTypeLabel();
    }

    public function getTypeLabel()
    {
        return match($this->expense_type) {
            'personal' => 'Personal Expense',
            'institute' => 'Institute Expense',
            default => 'Unknown',
        };
    }

    public function getStatusLabel()
    {
        return match($this->status) {
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'Unknown',
        };
    }

    public function getReimbursementLabel()
    {
        return match($this->reimbursement_status) {
            'pending' => 'Pending',
            'reimbursed' => 'Reimbursed',
            'cancelled' => 'Cancelled',
            default => 'Unknown',
        };
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function isPendingReimbursement()
    {
        return $this->status === 'approved' && $this->reimbursement_status === 'pending';
    }

    public function isReimbursed()
    {
        return $this->reimbursement_status === 'reimbursed';
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->where('expense_date', $date);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('expense_date', [$from, $to]);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('expense_type', $type);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
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

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopePendingReimbursement($query)
    {
        return $query->where('status', 'approved')
                    ->where('reimbursement_status', 'pending');
    }

    public function scopePersonal($query)
    {
        return $query->where('expense_type', 'personal');
    }

    public function scopeInstitute($query)
    {
        return $query->where('expense_type', 'institute');
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('expense_date', [
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