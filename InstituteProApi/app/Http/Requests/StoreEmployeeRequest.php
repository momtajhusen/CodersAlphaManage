<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_number' => 'required|string|max:20',
            'role' => 'required|string',
            'salary_type' => 'required|in:Fixed,Share Profit',
            'monthly_salary' => 'required|numeric|min:0',
            'profit_share_percentage' => 'nullable|numeric|min:0|max:100',
            'address' => 'nullable|string',
            'join_date' => 'required|date',
            'profile_photo' => 'nullable|image|max:2048',
            'attendance_mode' => 'nullable|in:direct_status,time_based',
            'preferred_shift' => 'nullable|in:day,night,both',
        ];
    }
}
