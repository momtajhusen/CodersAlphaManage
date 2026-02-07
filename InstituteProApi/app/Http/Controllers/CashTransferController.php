<?php

namespace App\Http\Controllers;

use App\Models\CashTransfer;
use App\Models\FloatLedger;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Notifications\FinanceUpdated;

class CashTransferController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = CashTransfer::with(['sender', 'receiver', 'createdBy'])
                ->orderBy('transfer_date', 'desc')
                ->orderBy('created_at', 'desc');

            if ($request->employee_id) {
                $query->where(function ($q) use ($request) {
                    $q->where('sender_id', $request->employee_id)
                      ->orWhere('receiver_id', $request->employee_id);
                });
            }

            if ($request->from_date && $request->to_date) {
                $query->whereBetween('transfer_date', [
                    $request->from_date,
                    $request->to_date
                ]);
            }

            $transfers = $query->paginate($request->per_page ?? 20);

            return response()->json([
                'success' => true,
                'data' => $transfers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:employees,id|different:sender_id', // Assuming sender is auth user's employee, handled below
            'amount' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $sender = $user->employee;

            if (!$sender) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not linked to an employee record.'
                ], 400);
            }
            
            // Check sender balance
            $currentBalance = $sender->getCurrentFloatBalance();
            if ($currentBalance < $request->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient float balance.'
                ], 400);
            }

            $receiver = Employee::findOrFail($request->receiver_id);

            // Create Transfer Record
            $transfer = CashTransfer::create([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'amount' => $request->amount,
                'transfer_date' => $request->transfer_date,
                'notes' => $request->notes,
                'created_by' => $user->id
            ]);

            // Deduct from Sender
            $senderNewBalance = $currentBalance - $request->amount;
            FloatLedger::create([
                'employee_id' => $sender->id,
                'transaction_type' => 'deduct',
                'amount' => $request->amount,
                'previous_balance' => $currentBalance,
                'new_balance' => $senderNewBalance,
                'reference_type' => CashTransfer::class,
                'reference_id' => $transfer->id,
                'description' => 'Transfer to ' . $receiver->full_name,
                'created_by' => $sender->id,
                'date' => $request->transfer_date,
                'created_at' => Carbon::now(),
            ]);

            // Add to Receiver
            $receiverPreviousBalance = $receiver->getCurrentFloatBalance();
            $receiverNewBalance = $receiverPreviousBalance + $request->amount;
            FloatLedger::create([
                'employee_id' => $receiver->id,
                'transaction_type' => 'add',
                'amount' => $request->amount,
                'previous_balance' => $receiverPreviousBalance,
                'new_balance' => $receiverNewBalance,
                'reference_type' => CashTransfer::class,
                'reference_id' => $transfer->id,
                'description' => 'Transfer from ' . $sender->full_name,
                'created_by' => $sender->id,
                'date' => $request->transfer_date,
                'created_at' => Carbon::now(),
            ]);

            DB::commit();

            try {
                // Notify Receiver
                $receiverUser = $receiver->user;
                if ($receiverUser) {
                    $title = "📥 Cash Received: Rs. " . number_format($request->amount, 2);
                    $message = "👤 From: " . $sender->full_name . "\n" .
                               "--------------------------------\n" .
                               "💰 My Balance: Rs. " . number_format($receiverNewBalance, 2) . "\n" .
                               "💰 Sender Balance: Rs. " . number_format($senderNewBalance, 2);

                    // Save to DB
                    \App\Models\Notification::create([
                        'user_id' => $receiverUser->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'transfer',
                        'reference_type' => CashTransfer::class,
                        'reference_id' => $transfer->id,
                    ]);

                    $receiverUser->notify(new FinanceUpdated(
                        $title,
                        $message,
                        [
                            'type' => 'cash_transfer_received',
                            'transfer_id' => $transfer->id,
                            'amount' => (float) $request->amount,
                            'date' => $request->transfer_date,
                            'from' => $sender->full_name,
                        ]
                    ));
                }

                // Notify Sender
                $senderUser = $sender->user;
                if ($senderUser) {
                    $title = "📤 Cash Sent: Rs. " . number_format($request->amount, 2);
                    $message = "👤 To: " . $receiver->full_name . "\n" .
                               "--------------------------------\n" .
                               "💰 My Balance: Rs. " . number_format($senderNewBalance, 2) . "\n" .
                               "💰 Receiver Balance: Rs. " . number_format($receiverNewBalance, 2);

                    // Save to DB
                    \App\Models\Notification::create([
                        'user_id' => $senderUser->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'transfer',
                        'reference_type' => CashTransfer::class,
                        'reference_id' => $transfer->id,
                    ]);

                    $senderUser->notify(new FinanceUpdated(
                        $title,
                        $message,
                        [
                            'type' => 'cash_transfer_sent',
                            'transfer_id' => $transfer->id,
                            'amount' => (float) $request->amount,
                            'date' => $request->transfer_date,
                            'to' => $receiver->full_name,
                        ]
                    ));
                }
            } catch (\Exception $e) {
                // Log notification failure but do not fail the request
                \Illuminate\Support\Facades\Log::error('Notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer successful',
                'data' => $transfer
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'sometimes|exists:employees,id',
            'amount' => 'sometimes|numeric|min:0.01',
            'transfer_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $transfer = CashTransfer::findOrFail($id);
            $user = Auth::user();
            $currentUserEmployee = $user->employee;

            // Permission check: Only Creator or Admin can edit? 
            // For now assuming any authorized user can edit if they have access.

            $needsFinancialUpdate = false;
            if (
                ($request->has('amount') && $request->amount != $transfer->amount) ||
                ($request->has('receiver_id') && $request->receiver_id != $transfer->receiver_id) ||
                ($request->has('sender_id') && $request->sender_id != $transfer->sender_id)
            ) {
                $needsFinancialUpdate = true;
            }

            if ($needsFinancialUpdate) {
                // STRICT CHECK before reverting
                // Revert involves taking money back from Receiver.
                // Receiver must have enough balance.
                // We need to check how much we are taking back.
                // Current transfer amount is what we are reversing.
                $receiver = Employee::findOrFail($transfer->receiver_id);
                $receiverBalance = $receiver->getCurrentFloatBalance();
                
                if ($receiverBalance < $transfer->amount) {
                     throw new \Exception("Cannot update transfer: Receiver ({$receiver->full_name}) has insufficient funds ({$receiverBalance}) to reverse the original transaction amount ({$transfer->amount}).");
                }

                // 1. Revert Old Transaction
                $this->revertTransferLedger($transfer);

                // 2. Update Transfer Record
                $transfer->fill($request->only(['receiver_id', 'amount', 'transfer_date', 'notes']));
                // Sender shouldn't change typically, but if needed, handle it. 
                // Assuming sender is fixed to original for now unless explicitly needed.
                $transfer->save();

                // 3. Create New Ledger Entries
                $this->createTransferLedger($transfer);

            } else {
                // Just update details
                $transfer->update($request->only(['transfer_date', 'notes']));
            }

            DB::commit();

            // Send Notification for Update
            try {
                $transfer->refresh(); // Reload to get latest data
                $updatedSender = $transfer->sender;
                $updatedReceiver = $transfer->receiver;
                
                // Get fresh balances
                $senderBalance = $updatedSender->getCurrentFloatBalance();
                $receiverBalance = $updatedReceiver->getCurrentFloatBalance();

                // Notify Receiver
                $receiverUser = $updatedReceiver->user;
                if ($receiverUser) {
                    $title = "🔄 Transfer Updated: Rs. " . number_format($transfer->amount, 2);
                    $message = "👤 From: " . $updatedSender->full_name . "\n" .
                               "--------------------------------\n" .
                               "💰 My Balance: Rs. " . number_format($receiverBalance, 2) . "\n" .
                               "💰 Sender Balance: Rs. " . number_format($senderBalance, 2);

                    \App\Models\Notification::create([
                        'user_id' => $receiverUser->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'transfer',
                        'reference_type' => CashTransfer::class,
                        'reference_id' => $transfer->id,
                    ]);
                    
                    $receiverUser->notify(new FinanceUpdated($title, $message, [
                        'type' => 'cash_transfer_updated',
                        'transfer_id' => $transfer->id,
                        'amount' => (float) $transfer->amount
                    ]));
                }

                // Notify Sender
                $senderUser = $updatedSender->user;
                if ($senderUser) {
                    $title = "🔄 Transfer Updated: Rs. " . number_format($transfer->amount, 2);
                    $message = "👤 To: " . $updatedReceiver->full_name . "\n" .
                               "--------------------------------\n" .
                               "💰 My Balance: Rs. " . number_format($senderBalance, 2) . "\n" .
                               "💰 Receiver Balance: Rs. " . number_format($receiverBalance, 2);

                    \App\Models\Notification::create([
                        'user_id' => $senderUser->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'transfer',
                        'reference_type' => CashTransfer::class,
                        'reference_id' => $transfer->id,
                    ]);

                    $senderUser->notify(new FinanceUpdated($title, $message, [
                        'type' => 'cash_transfer_updated',
                        'transfer_id' => $transfer->id,
                        'amount' => (float) $transfer->amount
                    ]));
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Update Notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer updated successfully',
                'data' => $transfer
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $transfer = CashTransfer::findOrFail($id);
            
            // Check if receiver has enough balance to reverse (Strict Mode)
            $receiver = Employee::findOrFail($transfer->receiver_id);
            $receiverBalance = $receiver->getCurrentFloatBalance();
            
            // If receiver balance is less than transfer amount, they can't "return" it
            if ($receiverBalance < $transfer->amount) {
                throw new \Exception("Cannot delete transfer: Receiver ({$receiver->full_name}) has insufficient funds ({$receiverBalance}) to reverse this transaction.");
            }

            // Revert Financials
            $this->revertTransferLedger($transfer);

            // Delete Transfer
            $transfer->delete();

            DB::commit();

            // Send Notification for Delete
            try {
                $sender = Employee::find($transfer->sender_id);
                $receiver = Employee::find($transfer->receiver_id);
                
                if ($sender && $receiver) {
                    $senderBalance = $sender->getCurrentFloatBalance();
                    $receiverBalance = $receiver->getCurrentFloatBalance();

                    // Notify Receiver (Funds Reversed/Deducted)
                    $receiverUser = $receiver->user;
                    if ($receiverUser) {
                        $title = "🗑️ Transfer Deleted: Rs. " . number_format($transfer->amount, 2);
                        $message = "👤 From: " . $sender->full_name . " (Reversed)\n" .
                                   "--------------------------------\n" .
                                   "💰 My Balance: Rs. " . number_format($receiverBalance, 2) . "\n" .
                                   "💰 Sender Balance: Rs. " . number_format($senderBalance, 2);

                        \App\Models\Notification::create([
                            'user_id' => $receiverUser->id,
                            'title' => $title,
                            'message' => $message,
                            'type' => 'transfer',
                            'reference_type' => CashTransfer::class,
                            'reference_id' => $id, // Use ID even if deleted
                        ]);
                        
                        $receiverUser->notify(new FinanceUpdated($title, $message, ['type' => 'cash_transfer_deleted']));
                    }

                    // Notify Sender (Funds Returned/Added)
                    $senderUser = $sender->user;
                    if ($senderUser) {
                        $title = "🗑️ Transfer Deleted: Rs. " . number_format($transfer->amount, 2);
                        $message = "👤 To: " . $receiver->full_name . " (Reversed)\n" .
                                   "--------------------------------\n" .
                                   "💰 My Balance: Rs. " . number_format($senderBalance, 2) . "\n" .
                                   "💰 Receiver Balance: Rs. " . number_format($receiverBalance, 2);

                        \App\Models\Notification::create([
                            'user_id' => $senderUser->id,
                            'title' => $title,
                            'message' => $message,
                            'type' => 'transfer',
                            'reference_type' => CashTransfer::class,
                            'reference_id' => $id,
                        ]);

                        $senderUser->notify(new FinanceUpdated($title, $message, ['type' => 'cash_transfer_deleted']));
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Delete Notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer deleted and reversed successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function revertTransferLedger(CashTransfer $transfer)
    {
        // 1. Revert Sender (Deduction)
        // Find the ledger entry for this transfer for the sender
        $senderLedger = FloatLedger::where('reference_type', CashTransfer::class)
            ->where('reference_id', $transfer->id)
            ->where('employee_id', $transfer->sender_id)
            ->where('transaction_type', 'deduct')
            ->first();

        if ($senderLedger) {
            // Since it was a deduction, we ADD the amount back to subsequent balances
            $this->adjustSubsequentBalances($transfer->sender_id, $senderLedger->id, $senderLedger->amount);
            $senderLedger->delete();
        } else {
            // If ledger not found, we should ensure we don't silently fail if the user expects money back.
            // However, if it's missing, maybe it was never deducted? 
            // Let's assume strict consistency: if transfer exists, ledger MUST exist.
            // But for safety against data corruption, we log it or throw?
            // User complaint: "money not returned". This implies ledger exists but wasn't found/deleted.
            // We'll try to be more flexible with reference_type just in case.
            $senderLedgerFallback = FloatLedger::where('reference_id', $transfer->id)
                ->where('employee_id', $transfer->sender_id)
                ->where('transaction_type', 'deduct')
                ->first();
                
            if ($senderLedgerFallback) {
                 $this->adjustSubsequentBalances($transfer->sender_id, $senderLedgerFallback->id, $senderLedgerFallback->amount);
                 $senderLedgerFallback->delete();
            }
        }

        // 2. Revert Receiver (Addition)
        // Find the ledger entry for this transfer for the receiver
        $receiverLedger = FloatLedger::where('reference_type', CashTransfer::class)
            ->where('reference_id', $transfer->id)
            ->where('employee_id', $transfer->receiver_id)
            ->where('transaction_type', 'add')
            ->first();

        if ($receiverLedger) {
            // Since it was an addition, we SUBTRACT the amount from subsequent balances
            $this->adjustSubsequentBalances($transfer->receiver_id, $receiverLedger->id, -($receiverLedger->amount));
            $receiverLedger->delete();
        } else {
             $receiverLedgerFallback = FloatLedger::where('reference_id', $transfer->id)
                ->where('employee_id', $transfer->receiver_id)
                ->where('transaction_type', 'add')
                ->first();
                
            if ($receiverLedgerFallback) {
                 $this->adjustSubsequentBalances($transfer->receiver_id, $receiverLedgerFallback->id, -($receiverLedgerFallback->amount));
                 $receiverLedgerFallback->delete();
            }
        }
    }

    private function createTransferLedger(CashTransfer $transfer)
    {
        $sender = Employee::findOrFail($transfer->sender_id);
        $receiver = Employee::findOrFail($transfer->receiver_id);

        // Deduct from Sender
        $senderCurrentBalance = $sender->getCurrentFloatBalance();
        $senderNewBalance = $senderCurrentBalance - $transfer->amount;
        
        FloatLedger::create([
            'employee_id' => $sender->id,
            'transaction_type' => 'deduct',
            'amount' => $transfer->amount,
            'previous_balance' => $senderCurrentBalance,
            'new_balance' => $senderNewBalance,
            'reference_type' => CashTransfer::class,
            'reference_id' => $transfer->id,
            'description' => 'Transfer to ' . $receiver->full_name,
            'created_by' => Auth::id() ? Auth::user()->employee->id : $sender->id, // Best effort
            'date' => $transfer->transfer_date,
            'created_at' => Carbon::now(),
        ]);

        // Add to Receiver
        $receiverCurrentBalance = $receiver->getCurrentFloatBalance();
        $receiverNewBalance = $receiverCurrentBalance + $transfer->amount;

        FloatLedger::create([
            'employee_id' => $receiver->id,
            'transaction_type' => 'add',
            'amount' => $transfer->amount,
            'previous_balance' => $receiverCurrentBalance,
            'new_balance' => $receiverNewBalance,
            'reference_type' => CashTransfer::class,
            'reference_id' => $transfer->id,
            'description' => 'Transfer from ' . $sender->full_name,
            'created_by' => Auth::id() ? Auth::user()->employee->id : $sender->id,
            'date' => $transfer->transfer_date,
            'created_at' => Carbon::now(),
        ]);
    }

    private function adjustSubsequentBalances($employeeId, $afterLedgerId, $adjustmentAmount)
    {
        if ($adjustmentAmount == 0) return;

        // Update all ledger entries created AFTER the deleted one
        // We use 'id' > $afterLedgerId as a proxy for time/sequence
        FloatLedger::where('employee_id', $employeeId)
            ->where('id', '>', $afterLedgerId)
            ->increment('previous_balance', $adjustmentAmount);

        FloatLedger::where('employee_id', $employeeId)
            ->where('id', '>', $afterLedgerId)
            ->increment('new_balance', $adjustmentAmount);
    }
}
