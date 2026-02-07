<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee' => $this->whenLoaded('employee', function () {
                return [
                    'id' => $this->employee->id,
                    'name' => $this->employee->full_name,
                ];
            }),
            'category' => $this->category,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'expense_type' => $this->expense_type,
            'expense_date' => optional($this->expense_date)->format('Y-m-d'),
            'date' => optional($this->expense_date)->format('Y-m-d'), // Keep for backward compatibility
            'paid_from' => $this->paid_from,
            'bill_photo_path' => $this->bill_photo_path,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
