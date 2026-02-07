<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $employeeId = $this->route('employee');
        $employee = \App\Models\Employee::find($employeeId);
        $userId = $employee ? $employee->user_id : null;

        return [
            'full_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $userId,
            'mobile_number' => 'sometimes|required|string|max:20',
            'role' => 'sometimes|required|string',
            'salary_type' => 'sometimes|required|in:Fixed,Share Profit',
            'monthly_salary' => 'sometimes|required|numeric|min:0',
            'profit_share_percentage' => 'nullable|numeric|min:0|max:100',
            'address' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'profile_photo' => 'nullable|image|max:2048',
            'attendance_mode' => 'sometimes|nullable|in:direct_status,time_based',
            'preferred_shift' => 'sometimes|nullable|in:day,night,both',
        ];
    }
}
