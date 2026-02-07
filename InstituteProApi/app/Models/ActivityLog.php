<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'actor_id',
        'action_type',
        'entity_type',
        'entity_id',
        'entity_code',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'device_info',
    ];

    public $timestamps = true;

    protected $dates = ['created_at', 'updated_at'];

    // Relationships
    public function actor()
    {
        return $this->belongsTo(Employee::class, 'actor_id');
    }

    // Methods
    public function getActionLabel()
    {
        return match($this->action_type) {
            'create' => 'Created',
            'update' => 'Updated',
            'delete' => 'Deleted',
            'approve' => 'Approved',
            'reject' => 'Rejected',
            'confirm' => 'Confirmed',
            'check_in' => 'Checked In',
            'check_out' => 'Checked Out',
            'assign' => 'Assigned',
            'accept' => 'Accepted',
            default => ucfirst($this->action_type),
        };
    }

    public function getEntityLabel()
    {
        return match($this->entity_type) {
            'employee' => 'Employee',
            'attendance' => 'Attendance',
            'income' => 'Income',
            'expense' => 'Expense',
            'task' => 'Task',
            'task_assignment' => 'Task Assignment',
            'self_logged_work' => 'Self-logged Work',
            default => ucfirst(str_replace('_', ' ', $this->entity_type)),
        };
    }

    public function getOldValuesArray()
    {
        return json_decode($this->old_values, true);
    }

    public function getNewValuesArray()
    {
        return json_decode($this->new_values, true);
    }

    public function getChanges()
    {
        $old = $this->getOldValuesArray() ?? [];
        $new = $this->getNewValuesArray() ?? [];

        $changes = [];

        foreach ($new as $key => $value) {
            if (!isset($old[$key]) || $old[$key] != $value) {
                $changes[$key] = [
                    'from' => $old[$key] ?? null,
                    'to' => $value,
                ];
            }
        }

        return $changes;
    }

    public function getDescription()
    {
        $actor = $this->actor?->full_name ?? 'System';
        $action = $this->getActionLabel();
        $entity = $this->getEntityLabel();

        return "{$actor} {$action} {$entity}";
    }

    // Scopes
    public function scopeByAction($query, $action)
    {
        return $query->where('action_type', $action);
    }

    public function scopeByEntityType($query, $type)
    {
        return $query->where('entity_type', $type);
    }

    public function scopeByEntityId($query, $id)
    {
        return $query->where('entity_id', $id);
    }

    public function scopeByActor($query, $actor_id)
    {
        return $query->where('actor_id', $actor_id);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        return $query->whereBetween('created_at', [
            $from . ' 00:00:00',
            $to . ' 23:59:59'
        ]);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}