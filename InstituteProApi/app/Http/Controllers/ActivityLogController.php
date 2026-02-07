<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get activity log
     */
    public function index(Request $request)
    {
        try {
            $query = ActivityLog::query();

            // Filter by entity type
            if ($request->entity_type) {
                $query->where('entity_type', $request->entity_type);
            }

            // Filter by action
            if ($request->action_type) {
                $query->where('action_type', $request->action_type);
            }

            // Filter by actor
            if ($request->actor_id) {
                $query->where('actor_id', $request->actor_id);
            }

            // Filter by date
            if ($request->from_date && $request->to_date) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            // Search filter
            if ($request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('action_type', 'like', "%{$search}%")
                      ->orWhere('entity_type', 'like', "%{$search}%")
                      ->orWhereHas('actor', function($subQuery) use ($search) {
                          $subQuery->where('full_name', 'like', "%{$search}%");
                      });
                });
            }

            $query->with('actor')
                  ->orderBy('created_at', 'desc');

            $per_page = $request->per_page ?? 50;
            $logs = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get entity change history
     */
    public function entityHistory($entity_type, $entity_id)
    {
        try {
            $logs = ActivityLog::where('entity_type', $entity_type)
                ->where('entity_id', $entity_id)
                ->with('actor')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's activities
     */
    public function userActivities($user_id, Request $request)
    {
        try {
            $query = ActivityLog::where('actor_id', $user_id);

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            $logs = $query->with('actor')
                         ->orderBy('created_at', 'desc')
                         ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity summary
     */
    public function summary(Request $request)
    {
        try {
            $from_date = $request->from_date ?? now()->startOfMonth();
            $to_date = $request->to_date ?? now();

            $logs = ActivityLog::whereBetween('created_at', [
                $from_date . ' 00:00:00',
                $to_date . ' 23:59:59'
            ])->get();

            $summary = [
                'total_activities' => $logs->count(),
                'by_action' => $logs->groupBy('action_type')
                    ->map(function ($items) {
                        return $items->count();
                    }),
                'by_entity' => $logs->groupBy('entity_type')
                    ->map(function ($items) {
                        return $items->count();
                    }),
                'by_actor' => $logs->groupBy('actor_id')
                    ->map(function ($items) {
                        return [
                            'count' => $items->count(),
                            'actor' => $items->first()->actor,
                        ];
                    }),
                'recent_activities' => $logs->sortByDesc('created_at')
                    ->take(10)
                    ->values(),
            ];

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export activity log
     */
    public function export(Request $request)
    {
        try {
            $query = ActivityLog::query();

            if ($request->entity_type) {
                $query->where('entity_type', $request->entity_type);
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            $logs = $query->with('actor')->get();

            // Create CSV
            $csv = "Actor,Action,Entity Type,Entity ID,Old Values,New Values,IP Address,Date\n";

            foreach ($logs as $log) {
                $actorName = $log->actor->full_name ?? 'System';
                $csv .= "\"{$actorName}\",";
                $csv .= "\"{$log->action_type}\",";
                $csv .= "\"{$log->entity_type}\",";
                $csv .= "\"{$log->entity_id}\",";
                $csv .= "\"" . str_replace('"', '""', $log->old_values ?? '') . "\",";
                $csv .= "\"" . str_replace('"', '""', $log->new_values ?? '') . "\",";
                $csv .= "\"{$log->ip_address}\",";
                $csv .= "\"{$log->created_at}\"\n";
            }

            return response($csv)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="activity-log.csv"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}