<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Income;
use App\Models\Expense;
use App\Models\FloatLedger;
use App\Models\Employee;
use Carbon\Carbon;

class FinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = Employee::where('role', 'Admin')->first();
        if (!$admin) {
            return;
        }

        // Seed Income
        Income::create([
            'income_type' => 'course_fee',
            'amount' => 5000.00,
            'description' => 'Fees for Class 10 Student - Rahul',
            'income_date' => Carbon::now()->subDays(2),
            'confirmed_by' => $admin->id,
            'status' => 'confirmed',
        ]);

        Income::create([
            'income_type' => 'other',
            'amount' => 10000.00,
            'description' => 'Annual Donation',
            'income_date' => Carbon::now()->subDays(5),
            'confirmed_by' => $admin->id,
            'status' => 'confirmed',
        ]);

        // Seed Expense
        Expense::create([
            'employee_id' => $admin->id,
            'expense_type' => 'institute',
            'category' => 'Office Supplies',
            'amount' => 500.00,
            'description' => 'Bought pens and paper',
            'expense_date' => Carbon::now()->subDays(1),
            'approved_by' => $admin->id,
            'status' => 'approved',
        ]);

        Expense::create([
            'employee_id' => $admin->id,
            'expense_type' => 'institute',
            'category' => 'Utilities',
            'amount' => 1200.00,
            'description' => 'Electricity Bill',
            'expense_date' => Carbon::now()->subDays(10),
            'approved_by' => $admin->id,
            'status' => 'approved',
        ]);

        // Seed Float Ledger
        FloatLedger::create([
            'employee_id' => $admin->id,
            'transaction_type' => 'Given',
            'amount' => 20000.00,
            'description' => 'Initial Float Balance',
            'date' => Carbon::now()->startOfMonth(),
            'previous_balance' => 0,
            'new_balance' => 20000.00,
        ]);
        
        FloatLedger::create([
            'employee_id' => $admin->id,
            'transaction_type' => 'Spent',
            'amount' => 500.00,
            'description' => 'Petty Cash for Supplies',
            'date' => Carbon::now()->subDays(1),
            'previous_balance' => 20000.00,
            'new_balance' => 19500.00,
        ]);
    }
}
