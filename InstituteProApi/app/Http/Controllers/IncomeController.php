<?php

namespace App\Http\Controllers;

use App\Models\Income;
use App\Models\FloatLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Traits\LogsActivity;
use App\Notifications\FinanceUpdated;

class IncomeController extends Controller
{
    use LogsActivity;

    /**
     * Get all income records
     */
    public function index(Request $request)
    {
        try {
            $query = Income::with(['contributor', 'heldBy', 'createdBy']);

            // Filters
            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }

            if ($request->income_type) {
                $query->where('income_type', $request->income_type);
            }

            if ($request->source_type) {
                $query->where('source_type', $request->source_type);
            }

            if ($request->contributor_id) {
                $query->where('contributor_id', $request->contributor_id);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('income_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $query->orderBy('income_date', 'desc');

            $per_page = min((int) ($request->per_page ?? 20), 50);
            $income = $query->paginate($per_page);

            return response()->json([
                'success' => true,
                'data' => \App\Http\Resources\IncomeResource::collection($income)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create income record
     */
    public function store(\App\Http\Requests\StoreIncomeRequest $request)
    {
        DB::beginTransaction();
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $income = Income::create([
                'employee_id' => $request->employee_id,
                'income_type' => $request->income_type,
                'source_type' => $request->source_type,
                'contributor_id' => $request->contributor_id,
                'held_by_id' => $request->held_by_id,
                'payment_method' => $request->payment_method,
                'category' => $request->category,
                'amount' => $request->amount,
                'description' => $request->description,
                'income_date' => $request->income_date,
                'status' => 'confirmed',
                'created_by' => $user->employee->id,
                'confirmed_by' => $user->employee->id,
            ]);

            // Handle file upload
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('income-receipts', 'public');
                $income->update(['receipt_file_path' => $path]);
            }

            // If cash is held by an employee, update their float balance
            if ($request->payment_method === 'cash' && $request->held_by_id) {
                $employee = \App\Models\Employee::find($request->held_by_id);
                $previousBalance = $employee->getCurrentFloatBalance();
                $newBalance = $previousBalance + $request->amount;

                FloatLedger::create([
                    'employee_id' => $request->held_by_id,
                    'transaction_type' => 'add', // Assuming 'add' is for addition
                    'amount' => $request->amount,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $newBalance,
                    'reference_type' => Income::class,
                    'reference_id' => $income->id,
                    'description' => 'Income Received: ' . $request->description,
                    'created_by' => $user->employee->id,
                    'created_at' => now(),
                ]);
            }

            // Log activity
            $this->logActivity('create', 'income', $income->id, 
                null, 
                $income->toArray()
            );

            DB::commit();

            $heldByUser = $income->heldBy?->user;
            if ($heldByUser) {
                $heldByUser->notify(new FinanceUpdated(
                    'Income Confirmed',
                    'Rs.' . $income->amount . ' added to your float',
                    [
                        'type' => 'income_confirmed',
                        'income_id' => $income->id,
                        'amount' => (float) $income->amount,
                        'category' => $income->category,
                        'date' => $income->income_date?->format('Y-m-d'),
                        'payment_method' => $income->payment_method,
                    ]
                ));
            }

            $ownerUser = $income->employee?->user;
            if ($ownerUser) {
                $ownerUser->notify(new FinanceUpdated(
                    'Income Recorded',
                    'Rs.' . $income->amount . ' ' . ($income->category ?? $income->getTypeLabel()) . ' recorded',
                    [
                        'type' => 'income_recorded',
                        'income_id' => $income->id,
                        'amount' => (float) $income->amount,
                        'category' => $income->category,
                        'date' => $income->income_date?->format('Y-m-d'),
                    ]
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Income record created',
                'data' => $income
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
     * Get income details
     */
    public function show($id)
    {
        try {
            $income = Income::with(['contributor', 'heldBy', 'createdBy'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $income
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Income record not found'
            ], 404);
        }
    }

    /**
     * Update income
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $income = Income::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'category' => 'string|max:100',
                'amount' => 'numeric|min:0',
                'description' => 'string',
                'income_date' => 'date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $old_values = $income->toArray();
            
            // Handle Financial Logic if amount changes
            if ($request->has('amount') && $request->amount != $income->amount) {
                // Find associated ledger
                $ledgerEntry = FloatLedger::where('reference_type', Income::class)
                    ->where('reference_id', $income->id)
                    ->where('transaction_type', 'add')
                    ->first();

                if ($ledgerEntry) {
                    $diff = $request->amount - $income->amount;
                    
                    // If diff is negative (e.g. 500 -> 200, diff = -300), we are removing money.
                    // Strict Check: User must have enough balance to remove money.
                    if ($diff < 0) {
                        $employee = \App\Models\Employee::find($ledgerEntry->employee_id);
                        if ($employee) {
                            $currentBalance = $employee->getCurrentFloatBalance();
                            // We need to remove abs($diff).
                            if ($currentBalance < abs($diff)) {
                                throw new \Exception("Cannot update income amount: Insufficient float balance to reduce income by " . abs($diff) . ". Current Balance: {$currentBalance}.");
                            }
                        }
                    }

                    // Update ledger amount
                    $ledgerEntry->amount = $request->amount;
                    $ledgerEntry->save();

                    // Adjust subsequent balances
                    // We need to apply the $diff to all subsequent entries
                    $this->adjustSubsequentBalances($ledgerEntry->employee_id, $ledgerEntry->id, $diff);
                }
            }

            $income->update($request->all());

            // Handle file upload
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('income-receipts', 'public');
                $income->update(['receipt_file_path' => $path]);
            }

            // Log activity
            $this->logActivity('update', 'income', $id, 
                $old_values, 
                $income->toArray()
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Income updated successfully',
                'data' => $income
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
     * Delete income record
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $income = Income::findOrFail($id);
            
            // Revert Float Ledger if applicable
            $ledgerEntry = FloatLedger::where('reference_type', Income::class)
                ->where('reference_id', $income->id)
                ->where('transaction_type', 'add')
                ->first();

            if ($ledgerEntry) {
                // STRICT CHECK: Ensure the employee has enough balance to revert this income
                // If they spent it (balance < amount), we cannot delete the income source.
                $employee = \App\Models\Employee::find($ledgerEntry->employee_id);
                if ($employee) {
                    $currentBalance = $employee->getCurrentFloatBalance();
                    if ($currentBalance < $ledgerEntry->amount) {
                         throw new \Exception("Cannot delete income: Insufficient float balance. You have likely spent these funds. Current Balance: {$currentBalance}, Required: {$ledgerEntry->amount}");
                    }
                }

                // We added money, so we need to SUBTRACT it to revert
                // adjustmentAmount = -amount
                $this->adjustSubsequentBalances($ledgerEntry->employee_id, $ledgerEntry->id, -($ledgerEntry->amount));
                $ledgerEntry->delete();
            }

            $income->delete();

            // Log activity
            $this->logActivity('delete', 'income', $id, 
                $income->toArray(), 
                null
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Income record deleted successfully'
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
     * Confirm income
     */
    public function confirm($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $income = Income::findOrFail($id);

            $old_values = $income->toArray();
            
            $income->update([
                'status' => 'confirmed',
                'confirmed_by' => $user->employee->id,
            ]);

            // Log activity
            $this->logActivity('confirm', 'income', $id, 
                $old_values, 
                $income->toArray()
            );

            // Send notification
            $this->sendNotification(
                'Income Confirmed',
                'Rs.' . $income->amount . ' income confirmed',
                'income'
            );

            return response()->json([
                'success' => true,
                'message' => 'Income confirmed successfully',
                'data' => $income
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject income
     */
    public function reject($id, Request $request)
    {
        try {
            $income = Income::findOrFail($id);

            $old_values = $income->toArray();
            
            $income->update([
                'status' => 'rejected',
                'notes' => $request->reason ?? 'Rejected by manager'
            ]);

            // Log activity
            $this->logActivity('reject', 'income', $id, 
                $old_values, 
                $income->toArray()
            );

            return response()->json([
                'success' => true,
                'message' => 'Income rejected',
                'data' => $income
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get income report
     */
    public function report(Request $request)
    {
        try {
            $query = Income::where('status', 'confirmed');

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('income_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $total_income = $query->sum('amount');
            $by_category = $query->groupBy('category')
                ->selectRaw('category, sum(amount) as total, count(*) as count')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_income' => $total_income,
                    'by_category' => $by_category
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
