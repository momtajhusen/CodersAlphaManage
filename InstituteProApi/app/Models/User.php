<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'google_avatar',
        'email_verified_at',
        'push_token', // Added push_token to fillable
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // Relationships
    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function expoTokens()
    {
        return $this->morphMany(\YieldStudio\LaravelExpoNotifier\Models\ExpoToken::class, 'owner');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereHas('employee', function ($q) {
            $q->where('status', 'active');
        });
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return $this->employee->full_name ?? 'Unknown';
    }
}
