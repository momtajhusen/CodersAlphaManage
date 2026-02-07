<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\FloatLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Mail;
use App\Mail\ExpenseStatusEmail;
use Illuminate\Support\Facades\Log;
use App\Notifications\FinanceUpdated;

class ExpenseController extends Controller
{
    use LogsActivity;

    /**
     * Get all expenses
     */
    public function index(Request $request)
    {
        try {
            $query = Expense::with(['employee', 'createdBy']);

            // Filters
            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }

            if ($request->expense_type) {
                $query->where('expense_type', $request->expense_type);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->category) {
                $query->where('category', $request->category);
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('expense_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $query->orderBy('expense_date', 'desc');

            $per_page = min((int) ($request->per_page ?? 20), 50);
            $expenses = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => \App\Http\Resources\ExpenseResource::collection($expenses)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create expense record
     */
    public function store(\App\Http\Requests\StoreExpenseRequest $request)
    {
        try {
            DB::beginTransaction();

            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            if (!$user->employee) {
                throw new \Exception('Current user is not linked to an employee record.');
            }

            $expense = Expense::create([
                'employee_id' => $request->employee_id,
                'expense_type' => $request->expense_type,
                'category' => $request->category,
                'amount' => $request->amount,
                'description' => $request->description,
                'expense_date' => $request->expense_date,
                'paid_from' => $request->paid_from,
                'float_holder_id' => $request->float_holder_id,
                'status' => 'approved', // Auto-approve
                'approved_by' => $user->employee->id,
                'approved_at' => now(),
                'created_by' => $user->employee->id,
            ]);

            // Handle bill upload
            if ($request->hasFile('bill_photo')) {
                $path = $request->file('bill_photo')->store('expense-bills', 'public');
                $expense->update(['bill_photo_path' => $path]);
            }

            // If paid from institute float, deduct immediately
            if ($request->paid_from === 'institute_float') {
                // Default to current user if float_holder_id is not provided
                $float_holder = $request->float_holder_id ?? $user->employee->id;
                
                // Get current balance
                $lastLedger = FloatLedger::where('employee_id', $float_holder)
                    ->latest()
                    ->first();
                
                $previousBalance = $lastLedger->new_balance ?? 0;
                $newBalance = $previousBalance - $request->amount;

                // Create ledger entry
                FloatLedger::create([
                    'employee_id' => $float_holder,
                    'transaction_type' => 'deduct',
                    'amount' => $request->amount,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $newBalance,
                    'reference_type' => 'expense',
                    'reference_id' => $expense->id,
                    'description' => 'Expense: ' . $request->category,
                    'created_by' => $user->employee->id,
                    'created_at' => now(),
                ]);
            }

            // Log activity
            $this->logActivity('create', 'expense', $expense->id, 
                null, 
                $expense->toArray()
            );

            DB::commit();

            // Send notification
            $this->sendNotification(
                'Expense Added',
                'Rs.' . $request->amount . ' ' . $request->category . ' expense added',
                'expense'
            );

            $employeeUser = $expense->employee?->user;
            if ($employeeUser) {
                $employeeUser->notify(new FinanceUpdated(
                    'Expense Added',
                    'Rs.' . $expense->amount . ' ' . $expense->category . ' expense added',
                    [
                        'type' => 'expense_created',
                        'expense_id' => $expense->id,
                        'amount' => (float) $expense->amount,
                        'category' => $expense->category,
                        'date' => $expense->expense_date?->format('Y-m-d'),
                        'paid_from' => $expense->paid_from,
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense recorded successfully',
                'data' => $expense
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Create Expense Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get expense details
     */
    public function show($id)
    {
        try {
            $expense = Expense::with(['employee', 'floatHolder', 'approver', 'createdBy'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found'
            ], 404);
        }
    }

    /**
     * Update expense
     */
    public function update(Request $request, $id)
    {
        try {
            $expense = Expense::findOrFail($id);

            // Only pending expenses can be updated
            /** @var \App\Models\User $user */
            $user = Auth::user();

            if ($expense->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending expenses can be updated'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'category' => 'string|max:100',
                'amount' => 'numeric|min:0',
                'description' => 'string',
                'expense_date' => 'date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $old_values = $expense->toArray();
            $expense->update($request->all());

            // Handle bill upload
            if ($request->hasFile('bill_photo')) {
                $path = $request->file('bill_photo')->store('expense-bills', 'public');
                $expense->update(['bill_photo_path' => $path]);
            }

            // Log activity
            $this->logActivity('update', 'expense', $id, 
                $old_values, 
                $expense->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully',
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete expense record
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $expense = Expense::findOrFail($id);

            // STRICT CHECK: Prevent deleting reimbursed expenses
            if ($expense->reimbursement_status === 'reimbursed') {
                throw new \Exception("Cannot delete expense: This expense has already been reimbursed. Please revert the reimbursement status first if you really need to delete it.");
            }
            
            // Revert Float Ledger if applicable
            $ledgerEntry = FloatLedger::where('reference_type', 'expense')
                ->where('reference_id', $expense->id)
                ->where('transaction_type', 'deduct')
                ->first();

            if ($ledgerEntry) {
                // We deducted money, so we need to ADD it to revert
                $this->adjustSubsequentBalances($ledgerEntry->employee_id, $ledgerEntry->id, $ledgerEntry->amount);
                $ledgerEntry->delete();
            }

            $expense->delete();

            // Log activity
            $this->logActivity('delete', 'expense', $id, 
                $expense->toArray(), 
                null
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Expense record deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function adjustSubsequentBalances($employeeId, $afterLedgerId, $adjustmentAmount)
    {
        if ($adjustmentAmount == 0) return;

        FloatLedger::where('employee_id', $employeeId)
            ->where('id', '>', $afterLedgerId)
            ->increment('previous_balance', $adjustmentAmount);

        FloatLedger::where('employee_id', $employeeId)
            ->where('id', '>', $afterLedgerId)
            ->increment('new_balance', $adjustmentAmount);
    }

    /**
     * Approve expense
     */
    public function approve($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $expense = Expense::findOrFail($id);

            if ($expense->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending expenses can be approved'
                ], 422);
            }

            $old_values = $expense->toArray();

            $expense->update([
                'status' => 'approved',
                'approved_by' => $user->employee->id,
                'approval_date' => now(),
                'reimbursement_status' => 'pending',
            ]);

            // Log activity
            $this->logActivity('approve', 'expense', $id, 
                $old_values, 
                $expense->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Expense Approved',
                'Rs.' . $expense->amount . ' expense approved',
                'expense'
            );

            $employeeUser = $expense->employee?->user;
            if ($employeeUser) {
                $employeeUser->notify(new FinanceUpdated(
                    'Expense Approved',
                    'Rs.' . $expense->amount . ' expense approved',
                    [
                        'type' => 'expense_approved',
                        'expense_id' => $expense->id,
                        'amount' => (float) $expense->amount,
                        'category' => $expense->category,
                        'date' => $expense->expense_date?->format('Y-m-d'),
                    ]
                ));
            }

            // Send Email Notification
            try {
                $employee = $expense->employee;
                if ($employee && $employee->email) {
                    $details = [
                        'name' => $employee->full_name,
                        'category' => $expense->category,
                        'amount' => $expense->amount,
                        'date' => $expense->expense_date,
                        'status' => 'approved',
                        'remarks' => $expense->notes
                    ];
                    Mail::to($employee->email)->send(new ExpenseStatusEmail($details));
                }
            } catch (\Exception $e) {
                Log::error('Expense Approval Email Failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense approved successfully',
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject expense
     */
    public function reject($id, Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $expense = Expense::findOrFail($id);

            if ($expense->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending expenses can be rejected'
                ], 422);
            }

            $old_values = $expense->toArray();

            $expense->update([
                'status' => 'rejected',
                'approved_by' => $user->employee->id,
                'approval_date' => now(),
                'notes' => $request->reason ?? 'Rejected by manager'
            ]);

            // Send Email Notification for Rejection
            try {
                $employee = $expense->employee;
                if ($employee && $employee->email) {
                    $details = [
                        'name' => $employee->full_name,
                        'category' => $expense->category,
                        'amount' => $expense->amount,
                        'date' => $expense->expense_date,
                        'status' => 'rejected',
                        'remarks' => $request->reason ?? 'Rejected by manager'
                    ];
                    Mail::to($employee->email)->send(new ExpenseStatusEmail($details));
                }
            } catch (\Exception $e) {
                Log::error('Expense Rejection Email Failed: ' . $e->getMessage());
            }

            // If it was institute float expense, reverse the deduction
            if ($expense->paid_from === 'institute_float' && $expense->float_holder_id) {
                $lastLedger = FloatLedger::where('employee_id', $expense->float_holder_id)
                    ->latest()
                    ->first();

                $previousBalance = $lastLedger->new_balance ?? 0;
                $newBalance = $previousBalance + $expense->amount;

                FloatLedger::create([
                    'employee_id' => $expense->float_holder_id,
                    'transaction_type' => 'add',
                    'amount' => $expense->amount,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $newBalance,
                    'reference_type' => 'expense_reversal',
                    'reference_id' => $expense->id,
                    'description' => 'Expense rejected: ' . $expense->category,
                    'created_by' => $user->employee->id,
                ]);
            }

            // Log activity
            $this->logActivity('reject', 'expense', $id, 
                $old_values, 
                $expense->toArray()
            );

            $employeeUser = $expense->employee?->user;
            if ($employeeUser) {
                $employeeUser->notify(new FinanceUpdated(
                    'Expense Rejected',
                    'Rs.' . $expense->amount . ' expense rejected',
                    [
                        'type' => 'expense_rejected',
                        'expense_id' => $expense->id,
                        'amount' => (float) $expense->amount,
                        'category' => $expense->category,
                        'date' => $expense->expense_date?->format('Y-m-d'),
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense rejected',
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark as reimbursed
     */
    public function reimburse($id)
    {
        try {
            $expense = Expense::findOrFail($id);

            if ($expense->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only approved expenses can be reimbursed'
                ], 422);
            }

            $old_values = $expense->toArray();

            $expense->update([
                'reimbursement_status' => 'reimbursed',
                'reimbursement_date' => now(),
            ]);

            // Log activity
            $this->logActivity('reimburse', 'expense', $id, 
                $old_values, 
                $expense->toArray()
            );

            $employeeUser = $expense->employee?->user;
            if ($employeeUser) {
                $employeeUser->notify(new FinanceUpdated(
                    'Expense Reimbursed',
                    'Rs.' . $expense->amount . ' reimbursed',
                    [
                        'type' => 'expense_reimbursed',
                        'expense_id' => $expense->id,
                        'amount' => (float) $expense->amount,
                        'category' => $expense->category,
                        'date' => $expense->expense_date?->format('Y-m-d'),
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense marked as reimbursed',
                'data' => $expense
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending reimbursements
     */
    public function pendingReimbursements()
    {
        try {
            $expenses = Expense::where('status', 'approved')
                ->where('reimbursement_status', 'pending')
                ->orderBy('expense_date', 'asc')
                ->get();

            $total = $expenses->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'expenses' => $expenses,
                    'total_pending' => $total
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expense report
     */
    public function report(Request $request)
    {
        try {
            $query = Expense::where('status', 'approved');

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('expense_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $total_expense = $query->sum('amount');
            $by_category = $query->groupBy('category')
                ->selectRaw('category, sum(amount) as total, count(*) as count')
                ->get();

            $by_employee = $query->groupBy('employee_id')
                ->selectRaw('employee_id, sum(amount) as total, count(*) as count')
                ->with('employee')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_expense' => $total_expense,
                    'by_category' => $by_category,
                    'by_employee' => $by_employee
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
