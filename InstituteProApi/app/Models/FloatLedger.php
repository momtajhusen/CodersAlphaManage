<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FloatLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'transaction_type',
        'amount',
        'previous_balance',
        'new_balance',
        'reference_type',
        'reference_id',
        'description',
        'created_by',
        'date',
        'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'previous_balance' => 'decimal:2',
        'new_balance' => 'decimal:2',
        'date' => 'date',
    ];

    public $timestamps = false;

    protected $dates = ['created_at'];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    // Methods
    public function getTypeLabel()
    {
        return match($this->transaction_type) {
            'add' => 'Added',
            'deduct' => 'Deducted',
            default => 'Unknown',
        };
    }

    public function isAddition()
    {
        return $this->transaction_type === 'add';
    }

    public function isDeduction()
    {
        return $this->transaction_type === 'deduct';
    }

    // Scopes
    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId)
                    ->orderBy('created_at', 'desc');
    }

    public function scopeAdditions($query)
    {
        return $query->where('transaction_type', 'add');
    }

    public function scopeDeductions($query)
    {
        return $query->where('transaction_type', 'deduct');
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [
            $from . ' 00:00:00',
            $to . ' 23:59:59'
        ]);
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return 'Rs.' . number_format($this->amount, 2);
    }

    public function getFormattedBalanceAttribute()
    {
        return 'Rs.' . number_format($this->new_balance, 2);
    }
}