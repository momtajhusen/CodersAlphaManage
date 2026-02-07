<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Traits\LogsActivity;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class EmployeeController extends Controller
{
    use LogsActivity;

    /**
     * Get all employees with pagination & filters
     */
    public function index(Request $request)
    {
        try {
            $query = Employee::query();

            // Filters
            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->role) {
                $query->where('role', $request->role);
            }

            if ($request->search) {
                $query->where('full_name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%')
                      ->orWhere('employee_code', 'like', '%' . $request->search . '%');
            }

            // Sorting
            $sortBy = $request->sort_by ?? 'created_at';
            $sortOrder = $request->sort_order ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $per_page = $request->per_page ?? 20;
            $employees = $query->paginate($per_page);

            // Append current balance
            $employees->getCollection()->transform(function ($employee) {
                $employee->current_balance = $employee->getCurrentFloatBalance();
                return $employee;
            });

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new employee
     */
    public function store(\App\Http\Requests\StoreEmployeeRequest $request)
    {
        try {
            DB::beginTransaction();

            // Create User first
            $generatedPassword = Str::random(8);
            $user = \App\Models\User::create([
                'name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make($generatedPassword),
            ]);

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => 'EMP-' . strtoupper(uniqid()),
                'full_name' => $request->full_name,
                'email' => $request->email,
                'mobile_number' => $request->mobile_number,
                'role' => $request->role,
                'salary_type' => $request->salary_type,
                'monthly_salary' => $request->monthly_salary,
                'profit_share_percentage' => $request->profit_share_percentage,
                'address' => $request->address,
                'join_date' => $request->join_date,
                'status' => 'active',
                'attendance_mode' => $request->attendance_mode ?? 'direct_status',
                'preferred_shift' => $request->preferred_shift ?? 'day',
            ]);

            // Log activity
            $this->logActivity('create', 'employee', $employee->id, 
                null,
                ['name' => $request->full_name, 'role' => $request->role]
            );

            // Send Welcome Email
            try {
                $details = [
                    'name' => $request->full_name,
                    'email' => $request->email,
                    'password' => $generatedPassword,
                    'role' => $request->role,
                ];
                Mail::to($request->email)->send(new WelcomeEmail($details));
            } catch (\Exception $e) {
                Log::error('Email sending failed: ' . $e->getMessage());
            }

            DB::commit(); 


            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully',
                'data' => $employee
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee details
     */
    public function show($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            
            $employee->load('attendance', 'income', 'expenses', 'taskAssignments');

            return response()->json([
                'success' => true,
                'data' => $employee
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }
    }

    /**
     * Update employee
     */
    public function update(\App\Http\Requests\UpdateEmployeeRequest $request, $id)
    {
        try {
            $employee = Employee::findOrFail($id);

            DB::beginTransaction();

            // Update User if needed
            if ($request->has('email') || $request->has('full_name')) {
                $user = $employee->user;
                if ($user) {
                    $user->update([
                        'name' => $request->full_name ?? $user->name,
                        'email' => $request->email ?? $user->email,
                    ]);
                }
            }

            $old_values = $employee->toArray();
            $employee->update($request->all());
            $new_values = $employee->toArray();

            // Log activity
            $this->logActivity('update', 'employee', $employee->id, 
                $old_values, 
                $new_values
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete employee
     */
    public function destroy(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $employee = Employee::findOrFail($id);
            
            // Delete all associated data if requested
            if ($request->boolean('delete_all_data')) {
                \App\Models\Attendance::where('employee_id', $employee->id)->delete();
                \App\Models\Expense::where('employee_id', $employee->id)->delete();
                \App\Models\Income::where('employee_id', $employee->id)->delete();
                \App\Models\TaskAssignment::where('employee_id', $employee->id)->delete();
                \App\Models\SelfLoggedWork::where('employee_id', $employee->id)->delete();
                \App\Models\FloatLedger::where('employee_id', $employee->id)->delete();
            }

            // Handle associated User to free up email
            if ($employee->user) {
                $user = $employee->user;
                
                // Detach user from employee to prevent cascade delete of employee
                // This ensures employee record remains (soft deleted) for history
                $employee->user_id = null;
                $employee->save();
                
                // Delete the user (frees up email for re-registration)
                $user->delete();
            }
            
            $employee->delete();

            // Log activity
            $this->logActivity('delete', 'employee', $id, 
                $employee->toArray(), 
                null
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employee deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employee change history
     */
    public function history($id)
    {
        try {
            $history = ActivityLog::where('entity_type', 'employee')
                ->where('entity_id', $id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $history
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}