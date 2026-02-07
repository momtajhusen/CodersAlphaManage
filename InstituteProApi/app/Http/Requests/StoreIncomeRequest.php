<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncomeRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'income_type' => 'required|in:salary,course_fee,personal_work,other',
            'source_type' => 'required|in:institute,personal_project',
            'contributor_id' => 'nullable|exists:employees,id',
            'held_by_id' => 'nullable|exists:employees,id',
            'payment_method' => 'required|in:cash,bank_transfer,online,cheque',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string',
            'income_date' => 'required|date',
            'receipt' => 'nullable|file|max:5120', // 5MB max
        ];
    }
}
