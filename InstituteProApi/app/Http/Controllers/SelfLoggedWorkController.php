<?php

namespace App\Http\Controllers;

use App\Models\SelfLoggedWork;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsActivity;

class SelfLoggedWorkController extends Controller
{
    use LogsActivity;

    /**
     * Get all self-logged work
     */
    public function index(Request $request)
    {
        try {
            $query = SelfLoggedWork::query();

            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }

            if ($request->status) {
                $query->where('verification_status', $request->status);
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('work_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $query->orderBy('work_date', 'desc');

            $per_page = $request->per_page ?? 20;
            $work = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => $work
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Log new work
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'work_title' => 'required|string|max:255',
            'description' => 'required|string',
            'time_spent_hours' => 'required|numeric|min:0.5|max:24',
            'work_date' => 'required|date|before_or_equal:today',
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

            $work = SelfLoggedWork::create([
                'employee_id' => $user->employee->id,
                'work_title' => $request->work_title,
                'description' => $request->description,
                'time_spent_hours' => $request->time_spent_hours,
                'work_date' => $request->work_date,
                'verification_status' => 'pending',
            ]);

            // Handle attachment
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('work-proofs', 'public');
                $work->update(['attachment_path' => $path]);
            }

            // Log activity
            $this->logActivity('create', 'self_logged_work', $work->id, 
                null, 
                $work->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Self-logged Work Submitted',
                $user->employee->full_name . ' logged: ' . $request->work_title,
                'work'
            );

            return response()->json([
                'success' => true,
                'message' => 'Work logged successfully',
                'data' => $work
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get work details
     */
    public function show($id)
    {
        try {
            $work = SelfLoggedWork::with('employee', 'verifier')
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $work
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Work record not found'
            ], 404);
        }
    }

    /**
     * Update work (if pending)
     */
    public function update(Request $request, $id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $work = SelfLoggedWork::findOrFail($id);

            if ($work->verification_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending work can be updated'
                ], 422);
            }

            if ($work->employee_id !== $user->employee->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only update your own work'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'work_title' => 'string|max:255',
                'description' => 'string',
                'time_spent_hours' => 'numeric|min:0.5|max:24',
                'work_date' => 'date|before_or_equal:today',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $old_values = $work->toArray();
            $work->update($request->all());

            // Handle attachment
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('work-proofs', 'public');
                $work->update(['attachment_path' => $path]);
            }

            // Log activity
            $this->logActivity('update', 'self_logged_work', $id, 
                $old_values, 
                $work->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Work updated successfully',
                'data' => $work
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete self-logged work
     */
    public function destroy($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $work = SelfLoggedWork::findOrFail($id);

            // Check authorization (only owner or admin/manager can delete)
            // For now, let's assume if they can access it, they can delete it or add role check
            if ($work->employee_id !== $user->employee->id && $user->employee->role === 'employee') {
                 return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this record'
                ], 403);
            }

            $work->delete();

            // Log activity
            $this->logActivity('delete', 'self_logged_work', $id, 
                $work->toArray(), 
                null
            );

            return response()->json([
                'success' => true,
                'message' => 'Work record deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve work
     */
    public function approve($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $work = SelfLoggedWork::findOrFail($id);

            if ($work->verification_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending work can be approved'
                ], 422);
            }

            $old_values = $work->toArray();

            $work->update([
                'verification_status' => 'approved',
                'verified_by' => $user->employee->id,
                'verified_at' => now(),
            ]);

            // Log activity
            $this->logActivity('approve', 'self_logged_work', $id, 
                $old_values, 
                $work->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Work Approved',
                $work->work_title . ' has been approved',
                'work'
            );

            return response()->json([
                'success' => true,
                'message' => 'Work approved successfully',
                'data' => $work
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject work
     */
    public function reject(Request $request, $id)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

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
            $work = SelfLoggedWork::findOrFail($id);

            if ($work->verification_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending work can be rejected'
                ], 422);
            }

            $old_values = $work->toArray();

            $work->update([
                'verification_status' => 'rejected',
                'verified_by' => $user->employee->id,
                'verified_at' => now(),
                'verification_notes' => $request->reason ?? 'Rejected by manager',
            ]);

            // Log activity
            $this->logActivity('reject', 'self_logged_work', $id, 
                $old_values, 
                $work->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Work rejected',
                'data' => $work
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my logged work
     */
    public function myWork(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $employee_id = $user->employee->id;

            $query = SelfLoggedWork::where('employee_id', $employee_id);

            if ($request->status) {
                $query->where('verification_status', $request->status);
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('work_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $query->orderBy('work_date', 'desc');

            $per_page = $request->per_page ?? 20;
            $work = $query->paginate($per_page);

            // Calculate total hours
            $total_hours = SelfLoggedWork::where('employee_id', $employee_id)
                ->where('verification_status', 'approved')
                ->sum('time_spent_hours');

            return response()->json([
                'success' => true,
                'data' => [
                    'work' => $work,
                    'total_approved_hours' => $total_hours
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
