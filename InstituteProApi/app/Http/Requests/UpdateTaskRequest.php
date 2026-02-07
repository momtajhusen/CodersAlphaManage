<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
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
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|required|in:low,medium,high',
            'category' => 'sometimes|required|string|max:100',
            'deadline' => 'sometimes|required|date|after:today',
            'budget_required' => 'nullable|numeric|min:0',
            'materials_needed' => 'nullable|string',
            'documents_needed' => 'nullable|string',
            'status' => 'sometimes|required|in:new,assigned,in_progress,completed,cancelled,late',
        ];
    }
}
