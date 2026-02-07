<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Employee;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $perPage = $request->per_page ?? 20;
            $page = $request->page ?? 1;
            $offset = ($page - 1) * $perPage;

            // 1. Incomes
            $incomes = DB::table('incomes')
                ->whereNull('deleted_at')
                ->select(
                    'id',
                    'amount',
                    'income_date as date',
                    'created_at',
                    DB::raw("'income' as type"),
                    'description',
                    'category',
                    'status',
                    'employee_id as user_id',
                    DB::raw("NULL as receiver_id"),
                    'source_type',
                    'income_type as sub_type'
                );

            // 2. Expenses
            $expenses = DB::table('expenses')
                ->whereNull('deleted_at')
                ->select(
                    'id',
                    'amount',
                    'expense_date as date',
                    'created_at',
                    DB::raw("'expense' as type"),
                    'description',
                    'category',
                    'status',
                    'employee_id as user_id',
                    DB::raw("NULL as receiver_id"),
                    DB::raw("NULL as source_type"),
                    'expense_type as sub_type'
                );

            // 3. Transfers
            $transfers = DB::table('cash_transfers')
                ->select(
                    'id',
                    'amount',
                    'transfer_date as date',
                    'created_at',
                    DB::raw("'transfer' as type"),
                    'notes as description',
                    DB::raw("'Transfer' as category"),
                    DB::raw("'completed' as status"),
                    'sender_id as user_id',
                    'receiver_id',
                    DB::raw("NULL as source_type"),
                    DB::raw("'transfer' as sub_type")
                );

            // Apply Filters
            if ($request->from_date && $request->to_date) {
                $incomes->whereBetween('income_date', [$request->from_date, $request->to_date]);
                $expenses->whereBetween('expense_date', [$request->from_date, $request->to_date]);
                $transfers->whereBetween('transfer_date', [$request->from_date, $request->to_date]);
            }

            if ($request->employee_id) {
                $incomes->where('employee_id', $request->employee_id);
                $expenses->where('employee_id', $request->employee_id);
                $transfers->where(function($q) use ($request) {
                    $q->where('sender_id', $request->employee_id)
                      ->orWhere('receiver_id', $request->employee_id);
                });
            }

            if ($request->type) {
                if ($request->type === 'office') {
                    $incomes->where('source_type', 'institute');
                    $expenses->where('expense_type', 'institute');
                    // Keep transfers as they are usually office related
                } elseif ($request->type === 'personal') {
                    $incomes->where('source_type', '!=', 'institute');
                    $expenses->where('expense_type', 'personal');
                    // Exclude transfers for personal view
                    $transfers->whereRaw('1 = 0');
                }
            }

            // Filter by Record Type (for Tabs: Income, Expense, Transfer)
            if ($request->record_type) {
                if ($request->record_type === 'income') {
                    $expenses->whereRaw('1 = 0');
                    $transfers->whereRaw('1 = 0');
                } elseif ($request->record_type === 'expense') {
                    $incomes->whereRaw('1 = 0');
                    $transfers->whereRaw('1 = 0');
                } elseif ($request->record_type === 'transfer') {
                    $incomes->whereRaw('1 = 0');
                    $expenses->whereRaw('1 = 0');
                }
            }

            // Search
            if ($request->search) {
                $search = $request->search;
                $searchLike = "%{$search}%";

                // Incomes Search
                $incomes->where(function($q) use ($searchLike) {
                    $q->where('description', 'like', $searchLike)
                      ->orWhere('category', 'like', $searchLike)
                      ->orWhere('amount', 'like', $searchLike);
                });

                // Expenses Search
                $expenses->where(function($q) use ($searchLike) {
                    $q->where('description', 'like', $searchLike)
                      ->orWhere('category', 'like', $searchLike)
                      ->orWhere('amount', 'like', $searchLike);
                });

                // Transfers Search
                $transfers->where(function($q) use ($searchLike) {
                    $q->where('notes', 'like', $searchLike)
                      ->orWhere('amount', 'like', $searchLike);
                });
            }

            // Union
            $query = $incomes->unionAll($expenses)->unionAll($transfers);

            // Get Total Count and Aggregates
            // To get accurate totals based on filters, we need to run aggregation on the subqueries BEFORE union or on the unioned result.
            // Aggregating on unioned result is cleaner but might be slower if dataset is huge. Given pagination is needed, we'll do it on the subquery alias.
            
            $aggregateQuery = DB::query()->fromSub($query, 'sub');
            
            $total = $aggregateQuery->count();
            
            // Calculate sums
            $sums = $aggregateQuery->selectRaw("
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) as total_transfer
            ")->first();

            // Get Data
            $results = DB::query()->fromSub($query, 'sub')
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($perPage)
                ->offset($offset)
                ->get();

            // Enrich with User Names
            $userIds = $results->pluck('user_id')->filter()->toArray();
            $receiverIds = $results->pluck('receiver_id')->filter()->toArray();
            $allIds = array_unique(array_merge($userIds, $receiverIds));

            $employees = Employee::whereIn('id', $allIds)->get()->keyBy('id');

            // Format Response
            $data = $results->map(function($item) use ($employees) {
                $user = $employees[$item->user_id] ?? null;
                $receiver = $employees[$item->receiver_id] ?? null;

                // Construct Title/Description similar to frontend logic
                $title = $item->description;
                if ($item->type === 'transfer') {
                    $title = "Transfer to " . ($receiver ? $receiver->full_name : 'Unknown');
                }

                return [
                    'id' => $item->id,
                    'type' => $item->type,
                    'amount' => $item->amount,
                    'date' => $item->date, // sortDate
                    'sortDate' => $item->date,
                    'created_at' => $item->created_at,
                    'category' => $item->category,
                    'description' => $item->description,
                    'title' => $title,
                    'status' => $item->status,
                    'source_type' => $item->source_type,
                    'expense_type' => $item->sub_type,
                    'contributor' => $user ? ['id' => $user->id, 'full_name' => $user->full_name, 'first_name' => explode(' ', $user->full_name)[0]] : null,
                    'employee' => $user ? ['id' => $user->id, 'full_name' => $user->full_name, 'first_name' => explode(' ', $user->full_name)[0]] : null,
                    'sender' => $user ? ['id' => $user->id, 'full_name' => $user->full_name] : null,
                    'receiver' => $receiver ? ['id' => $receiver->id, 'full_name' => $receiver->full_name] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage)
                ],
                'totals' => [
                    'income' => (float)($sums->total_income ?? 0),
                    'expense' => (float)($sums->total_expense ?? 0),
                    'transfer' => (float)($sums->total_transfer ?? 0),
                    'balance' => (float)(($sums->total_income ?? 0) - ($sums->total_expense ?? 0))
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
