<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'reference_type',
        'reference_id',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Methods
    public function getTypeIcon()
    {
        return match($this->type) {
            'task' => 'clipboard',
            'expense' => 'credit-card',
            'income' => 'trending-up',
            'attendance' => 'calendar',
            'work' => 'briefcase',
            'system' => 'alert-circle',
            default => 'bell',
        };
    }

    public function getTypeColor()
    {
        return match($this->type) {
            'task' => 'primary',
            'expense' => 'warning',
            'income' => 'success',
            'attendance' => 'info',
            'work' => 'secondary',
            'system' => 'danger',
            default => 'light',
        };
    }

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this;
    }

    public function markAsUnread()
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return $this;
    }

    // Scopes
    public function scopeForUser($query, $user_id)
    {
        return $query->where('user_id', $user_id);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}