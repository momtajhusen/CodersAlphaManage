<?php

namespace App\Http\Controllers;

use App\Models\TaskAssignment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsActivity;
use App\Notifications\TaskUpdated;

class TaskAssignmentController extends Controller
{
    use LogsActivity;

    /**
     * Get task assignments
     */
    public function index(Request $request)
    {
        try {
            $query = TaskAssignment::query();

            if ($request->task_id) {
                $query->where('task_id', $request->task_id);
            }

            if ($request->assigned_to) {
                $query->where('assigned_to', $request->assigned_to);
            }

            if ($request->status) {
                $query->where('assignment_status', $request->status);
            }

            $query->with('task', 'assignee', 'assigner');

            $per_page = min((int) ($request->per_page ?? 20), 50);
            $assignments = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my assignments
     */
    public function myAssignments(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $employee_id = $user->employee->id;

            $query = TaskAssignment::where('assigned_to', $employee_id)
                ->with('task', 'assignee', 'assigner');

            // Filter by status
            if ($request->status) {
                $query->where('assignment_status', $request->status);
            }

            // Filter by task status
            if ($request->task_status) {
                $query->whereHas('task', function ($q) use ($request) {
                    $q->where('status', $request->task_status);
                });
            }

            $query->orderBy('created_at', 'desc');

            $per_page = min((int) ($request->per_page ?? 20), 50);
            $assignments = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept task assignment
     */
    public function accept($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $assignment = TaskAssignment::findOrFail($id);

            if ($assignment->assigned_to !== $user->employee->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot accept this assignment'
                ], 403);
            }

            if ($assignment->assignment_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending assignments can be accepted'
                ], 422);
            }

            $old_values = $assignment->toArray();

            $assignment->update([
                'assignment_status' => 'accepted',
                'response_date' => now(),
                'actual_start_date' => now(),
            ]);

            // Log activity
            $this->logActivity('accept', 'task_assignment', $id, 
                $old_values, 
                $assignment->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Assignment Accepted',
                $user->employee->full_name . ' accepted task',
                'task'
            );

            $task = Task::find($assignment->task_id);
            $creatorUser = optional($task?->creator)->user;
            if ($creatorUser) {
                $creatorUser->notify(new TaskUpdated(
                    'Assignment Accepted',
                    $user->employee->full_name . ' accepted task: ' . ($task?->title ?? ''),
                    [
                        'type' => 'task_assignment_accepted',
                        'task_id' => $assignment->task_id,
                        'assignee' => $user->employee->full_name,
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Assignment accepted successfully',
                'data' => $assignment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject task assignment
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $assignment = TaskAssignment::findOrFail($id);

            if ($assignment->assigned_to !== $user->employee->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot reject this assignment'
                ], 403);
            }

            if ($assignment->assignment_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending assignments can be rejected'
                ], 422);
            }

            $old_values = $assignment->toArray();

            $assignment->update([
                'assignment_status' => 'rejected',
                'response_date' => now(),
                'notes' => $request->reason,
            ]);

            // Log activity
            $this->logActivity('reject', 'task_assignment', $id, 
                $old_values, 
                $assignment->toArray()
            );

            // Send notification to manager
            $this->sendNotification(
                'Assignment Rejected',
                $user->employee->full_name . ' rejected task: ' . ($request->reason ?? ''),
                'task'
            );

            $task = Task::find($assignment->task_id);
            $creatorUser = optional($task?->creator)->user;
            if ($creatorUser) {
                $creatorUser->notify(new TaskUpdated(
                    'Assignment Rejected',
                    $user->employee->full_name . ' rejected task: ' . ($task?->title ?? ''),
                    [
                        'type' => 'task_assignment_rejected',
                        'task_id' => $assignment->task_id,
                        'assignee' => $user->employee->full_name,
                        'reason' => $request->reason,
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Assignment rejected',
                'data' => $assignment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update time tracking
     */
    public function updateTime(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'actual_hours' => 'required|numeric|min:0',
            'estimated_hours' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $assignment = TaskAssignment::findOrFail($id);

            $old_values = $assignment->toArray();

            $assignment->update([
                'actual_hours' => $request->actual_hours,
                'estimated_hours' => $request->estimated_hours ?? $assignment->estimated_hours,
            ]);

            // Log activity
            $this->logActivity('update_time', 'task_assignment', $id, 
                $old_values, 
                $assignment->toArray()
            );

            $task = Task::find($assignment->task_id);
            $creatorUser = optional($task?->creator)->user;
            if ($creatorUser) {
                $creatorUser->notify(new TaskUpdated(
                    'Time Updated',
                    ($task?->title ?? 'Task') . ' time updated to ' . $assignment->actual_hours . 'h',
                    [
                        'type' => 'task_time_updated',
                        'task_id' => $assignment->task_id,
                        'assignee' => optional($assignment->assignee)->full_name,
                        'actual_hours' => (float) $assignment->actual_hours,
                        'estimated_hours' => (float) $assignment->estimated_hours,
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Time updated successfully',
                'data' => $assignment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
