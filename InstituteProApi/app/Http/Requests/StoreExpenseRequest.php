<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'expense_type' => 'required|in:personal,institute',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string',
            'expense_date' => 'required|date',
            'paid_from' => 'required|in:personal_money,institute_float',
            'float_holder_id' => 'nullable|exists:employees,id',
            'bill_photo' => 'nullable|file|max:5120', // 5MB max
        ];
    }
}
