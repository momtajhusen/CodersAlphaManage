<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncomeResource extends JsonResource
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
            'amount' => (float) $this->amount,
            'category' => $this->category,
            'income_type' => $this->income_type,
            'source_type' => $this->source_type,
            'status' => $this->status,
            'income_date' => optional($this->income_date)->format('Y-m-d'),
            'date' => optional($this->income_date)->format('Y-m-d'), // Keep for backward compatibility if needed
            'held_by' => $this->whenLoaded('heldBy', function () {
                return [
                    'id' => $this->heldBy->id,
                    'name' => $this->heldBy->full_name,
                ];
            }),
            'contributor' => $this->whenLoaded('contributor', function () {
                return [
                    'id' => $this->contributor->id,
                    'name' => $this->contributor->full_name,
                ];
            }),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
