<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high',
            'category' => 'required|string|max:100',
            'deadline' => 'required|date',
            'budget_required' => 'nullable|numeric|min:0',
            'materials_needed' => 'nullable|string',
            'documents_needed' => 'nullable|string',
            'assigned_to' => 'nullable|array',
            'assigned_to.*' => 'exists:employees,id',
        ];
    }
}
