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
        // 1. Send Expo Push Notification (Priority)
        try {
            $query = \YieldStudio\LaravelExpoNotifier\Models\ExpoToken::query();
            
            $tokens = $query->pluck('value')->toArray();
            
            if (!empty($tokens)) {
                $chunks = array_chunk($tokens, 100); // Expo allows up to 100 tokens per request
                
                foreach ($chunks as $chunk) {
                    try {
                        $response = \Illuminate\Support\Facades\Http::post('https://exp.host/--/api/v2/push/send', [
                            'to' => $chunk,
                            'title' => $title,
                            'body' => $message,
                            'sound' => 'default',
                            'data' => ['type' => $type],
                        ]);
                        
                        if ($response->failed()) {
                            \Illuminate\Support\Facades\Log::error('Expo Push Failed: ' . $response->body());
                        } else {
                            \Illuminate\Support\Facades\Log::info('Expo Push Sent Count: ' . count($chunk));
                        }
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Expo Push Exception: ' . $e->getMessage());
                    }
                }
            } else {
                \Illuminate\Support\Facades\Log::info('Expo Push: No tokens found');
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Expo Push General Error: ' . $e->getMessage());
        }

        // 2. Log Internal DB Notification (Secondary)
        try {
            \App\Models\Notification::create([
                'user_id' => $userId, // Default to admin (ID 1)
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            // Silently fail DB logging if user doesn't exist etc.
            \Illuminate\Support\Facades\Log::error('DB Notification Error: ' . $e->getMessage());
        }
    }
}
