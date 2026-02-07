<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    /**
     * Log an activity
     *
     * @param string $action
     * @param string $entityType
     * @param int|string $entityId
     * @param array|null $oldValues
     * @param array|null $newValues
     * @return void
     */
    protected function logActivity($action, $entityType, $entityId, $oldValues = null, $newValues = null)
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();
            
            ActivityLog::create([
                'actor_id' => $user ? $user->employee?->id : null,
                'action_type' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_values' => $oldValues ? json_encode($oldValues) : null,
                'new_values' => $newValues ? json_encode($newValues) : null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Silently fail logging to avoid stopping main process
            // \Log::error('Activity Log Error: ' . $e->getMessage());
        }
    }

    protected function sendNotification($title, $message, $type, $userId = 1)
    {
        try {
            \App\Models\Notification::create([
                'user_id' => $userId, // Default to admin (ID 1)
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            // Silently fail
        }
    }
}
