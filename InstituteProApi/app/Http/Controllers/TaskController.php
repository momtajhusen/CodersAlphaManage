<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Mail;
use App\Mail\TaskAssignedEmail;
use Illuminate\Support\Facades\Log;
use App\Notifications\TaskUpdated;

class TaskController extends Controller
{
    use LogsActivity;
    /**
     * Get all tasks
     */
    public function index(Request $request)
    {
        try {
            $query = Task::query();

            // Filters
            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->priority) {
                $query->where('priority', $request->priority);
            }

            if ($request->category) {
                $query->where('category', $request->category);
            }

            if ($request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('deadline', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            // Check for overdue tasks
            $query->select('tasks.*')
                  ->selectRaw('CASE WHEN deadline < CURDATE() AND status != "completed" THEN true ELSE false END as is_overdue');

            if ($request->overdue) {
                $query->where('deadline', '<', Carbon::today())
                      ->where('status', '!=', 'completed');
            }

            if ($request->assigned_to) {
                $query->whereHas('assignments', function($q) use ($request) {
                    $q->where('assigned_to', $request->assigned_to);
                });
            }

            $query->orderBy('deadline', 'asc');

            $per_page = min((int) ($request->per_page ?? 20), 50);
            $tasks = $query->with(['assignments.assignee'])->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => \App\Http\Resources\TaskResource::collection($tasks)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create task
     */
    public function store(\App\Http\Requests\StoreTaskRequest $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $task = Task::create([
                'task_code' => 'TASK-' . strtoupper(uniqid()),
                'title' => $request->title,
                'description' => $request->description,
                'priority' => $request->priority,
                'category' => $request->category,
                'deadline' => $request->deadline,
                'budget_required' => $request->budget_required,
                'materials_needed' => $request->materials_needed,
                'documents_needed' => $request->documents_needed,
                'status' => 'new',
                'created_by' => $user->employee->id,
            ]);

            // Handle assignments
            if ($request->has('assigned_to') && is_array($request->assigned_to)) {
                foreach ($request->assigned_to as $employeeId) {
                    TaskAssignment::create([
                        'task_id' => $task->id,
                        'assigned_to' => $employeeId,
                        'assigned_by' => $user->employee->id,
                        'assignment_status' => 'pending',
                    ]);

                    // Send Email to Assignee
                    try {
                        $assignee = \App\Models\Employee::find($employeeId);
                        if ($assignee) {
                            if ($assignee->email) {
                                $details = [
                                    'name' => $assignee->full_name,
                                    'title' => $task->title,
                                    'description' => $task->description,
                                    'priority' => $task->priority,
                                    'deadline' => $task->deadline,
                                ];
                                Mail::to($assignee->email)->send(new TaskAssignedEmail($details));
                            }
                            if ($assignee->user) {
                                $assignee->user->notify(new TaskUpdated(
                                    'Task Assigned',
                                    'You have been assigned: ' . $task->title,
                                    [
                                        'type' => 'task_assigned',
                                        'task_id' => $task->id,
                                        'assigned_by' => $user->employee->full_name,
                                        'deadline' => optional($task->deadline)->format('Y-m-d'),
                                        'priority' => $task->priority,
                                    ]
                                ));
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('Task Assignment Email Failed: ' . $e->getMessage());
                    }
                }

                $task->update(['status' => 'assigned']);
            }

            // Log activity
            $this->logActivity('create', 'task', $task->id, 
                null, 
                $task->toArray()
            );

            // Send notification
            $this->sendNotification(
                'New Task Created',
                'Task: ' . $task->title,
                'task'
            );

            // Return resource to match list format
            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => new \App\Http\Resources\TaskResource($task->load('creator'))
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get task details
     */
    public function show($id)
    {
        try {
            $task = Task::with('assignments', 'assignments.assignee', 'creator')
                ->findOrFail($id);

            // Check if overdue
            if ($task->deadline < Carbon::today() && $task->status !== 'completed') {
                $task->status = 'late';
                $task->save();
            }

            return response()->json([
                'success' => true,
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found'
            ], 404);
        }
    }

    /**
     * Update task
     */
    public function update(\App\Http\Requests\UpdateTaskRequest $request, $id)
    {
        try {
            $task = Task::findOrFail($id);

            $old_values = $task->toArray();
            $task->update($request->validated());

            // Check if status is completed
            if ($request->status === 'completed') {
                $task->update(['completed_date' => now()]);
            }

            // Log activity
            $this->logActivity('update', 'task', $id, 
                $old_values, 
                $task->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Task Updated',
                'Task: ' . $task->title . ' has been updated',
                'task'
            );

            foreach ($task->assignments as $assign) {
                if ($assign->assignee && $assign->assignee->user) {
                    $assign->assignee->user->notify(new TaskUpdated(
                        'Task Updated',
                        $task->title . ' has been updated',
                        [
                            'type' => 'task_updated',
                            'task_id' => $task->id,
                            'status' => $task->status,
                            'deadline' => optional($task->deadline)->format('Y-m-d'),
                        ]
                    ));
                }
            }
            $creatorUser = optional($task->creator)->user;
            if ($creatorUser) {
                // Save to DB
                try {
                    \App\Models\Notification::create([
                        'user_id' => $creatorUser->id,
                        'title' => 'Task Updated',
                        'message' => $task->title . ' has been updated',
                        'type' => 'task',
                        'reference_type' => 'task',
                        'reference_id' => $task->id,
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('DB Notification Error: ' . $e->getMessage());
                }

                $creatorUser->notify(new TaskUpdated(
                    'Task Updated',
                    $task->title . ' has been updated',
                    [
                        'type' => 'task_updated',
                        'task_id' => $task->id,
                        'status' => $task->status,
                        'deadline' => optional($task->deadline)->format('Y-m-d'),
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'data' => new \App\Http\Resources\TaskResource($task->load(['creator', 'assignments.assignee']))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete task
     */
    public function destroy($id)
    {
        try {
            $task = Task::findOrFail($id);
            
            $task->delete();

            // Log activity
            $this->logActivity('delete', 'task', $id, 
                $task->toArray(), 
                null
            );

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign task to employees
     */
    public function assign(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|array',
            'assigned_to.*' => 'exists:employees,id',
            'estimated_hours' => 'nullable|numeric|min:0',
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
            $task = Task::findOrFail($id);

            // Create assignments
            foreach ($request->assigned_to as $employee_id) {
                TaskAssignment::create([
                    'task_id' => $id,
                    'assigned_to' => $employee_id,
                    'assigned_by' => $user->employee->id,
                    'assignment_status' => 'pending',
                    'estimated_hours' => $request->estimated_hours,
                ]);

                // Send notification to employee
                $this->sendNotification(
                    'Task Assigned',
                    'You have been assigned: ' . $task->title,
                    'task',
                    $employee_id
                );

                // Send Email to Assignee
                try {
                    $assignee = \App\Models\Employee::find($employee_id);
                    if ($assignee && $assignee->email) {
                        $details = [
                            'name' => $assignee->full_name,
                            'title' => $task->title,
                            'description' => $task->description,
                            'priority' => $task->priority,
                            'deadline' => $task->deadline,
                        ];
                        Mail::to($assignee->email)->send(new TaskAssignedEmail($details));
                    }
                } catch (\Exception $e) {
                    Log::error('Task Assignment Email Failed: ' . $e->getMessage());
                }
            }

            // Update task status
            $task->update(['status' => 'assigned']);

            // Log activity
            $this->logActivity('assign', 'task', $id, 
                null, 
                ['assigned_to' => $request->assigned_to]
            );

            return response()->json([
                'success' => true,
                'message' => 'Task assigned successfully',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update task progress
     */
    public function updateProgress(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'progress_percentage' => 'required|integer|min:0|max:100',
            'notes' => 'nullable|string',
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
            $task = Task::findOrFail($id);

            // Find assignment for current user
            $assignment = TaskAssignment::where('task_id', $id)
                ->where('assigned_to', $user->employee->id)
                ->firstOrFail();

            $old_progress = $assignment->progress_percentage;
            
            $assignment->update([
                'progress_percentage' => $request->progress_percentage,
                'notes' => $request->notes,
            ]);

            // Update task status to in_progress if starting
            if ($old_progress == 0 && $request->progress_percentage > 0) {
                $task->update(['status' => 'in_progress']);
                $assignment->update(['actual_start_date' => now()]);
            }

            // Log activity
            $this->logActivity('update_progress', 'task', $id, 
                ['progress' => $old_progress], 
                ['progress' => $request->progress_percentage]
            );

            // Send notification
            $this->sendNotification(
                'Task Progress Updated',
                $task->title . ': ' . $request->progress_percentage . '%',
                'task'
            );

            $creatorUser = optional($task->creator)->user;
            if ($creatorUser) {
                // Save to DB
                try {
                    \App\Models\Notification::create([
                        'user_id' => $creatorUser->id,
                        'title' => 'Task Progress Updated',
                        'message' => $task->title . ': ' . $request->progress_percentage . '%',
                        'type' => 'task',
                        'reference_type' => 'task',
                        'reference_id' => $task->id,
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('DB Notification Error: ' . $e->getMessage());
                }

                $creatorUser->notify(new TaskUpdated(
                    'Task Progress Updated',
                    $task->title . ': ' . $request->progress_percentage . '%',
                    [
                        'type' => 'task_progress',
                        'task_id' => $task->id,
                        'progress' => (int) $request->progress_percentage,
                        'assignee' => $user->employee->full_name,
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Progress updated successfully',
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
     * Mark task as complete
     */
    public function complete(Request $request, $id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $task = Task::findOrFail($id);
            $employeeId = $user->employee->id;

            // Authorization check: Only Creator, Assignee, or Admin can complete
            $isCreator = $task->created_by == $employeeId;
            $isAssignee = $task->assignments()->where('assigned_to', $employeeId)->exists();
            $isAdmin = $user->employee->role === 'admin'; // Assuming role check

            if (!$isCreator && !$isAssignee && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to complete this task'
                ], 403);
            }

            $task->update([
                'status' => 'completed',
                'completed_date' => now(),
            ]);

            // Log activity
            $this->logActivity('complete', 'task', $id, 
                null, 
                ['status' => 'completed']
            );

            // Send notification
            $this->sendNotification(
                'Task Completed',
                $task->title . ' has been completed',
                'task'
            );

            foreach ($task->assignments as $assign) {
                if ($assign->assignee && $assign->assignee->user) {
                    // Save to DB
                    try {
                        \App\Models\Notification::create([
                            'user_id' => $assign->assignee->user->id,
                            'title' => 'Task Completed',
                            'message' => $task->title . ' has been completed',
                            'type' => 'task',
                            'reference_type' => 'task',
                            'reference_id' => $task->id,
                        ]);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('DB Notification Error: ' . $e->getMessage());
                    }

                    $assign->assignee->user->notify(new TaskUpdated(
                        'Task Completed',
                        $task->title . ' has been completed',
                        [
                            'type' => 'task_completed',
                            'task_id' => $task->id,
                            'completed_by' => $user->employee->full_name,
                            'completed_date' => now()->format('Y-m-d'),
                        ]
                    ));
                }
            }
            $creatorUser = optional($task->creator)->user;
            if ($creatorUser) {
                // Save to DB
                try {
                    \App\Models\Notification::create([
                        'user_id' => $creatorUser->id,
                        'title' => 'Task Completed',
                        'message' => $task->title . ' has been completed',
                        'type' => 'task',
                        'reference_type' => 'task',
                        'reference_id' => $task->id,
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('DB Notification Error: ' . $e->getMessage());
                }

                $creatorUser->notify(new TaskUpdated(
                    'Task Completed',
                    $task->title . ' has been completed',
                    [
                        'type' => 'task_completed',
                        'task_id' => $task->id,
                        'completed_by' => $user->employee->full_name,
                        'completed_date' => now()->format('Y-m-d'),
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Task marked as completed',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
