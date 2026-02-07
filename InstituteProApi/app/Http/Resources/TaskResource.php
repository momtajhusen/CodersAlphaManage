<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
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
            'task_code' => $this->task_code,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'category' => $this->category,
            'deadline' => optional($this->deadline)->format('Y-m-d'),
            'completed_date' => optional($this->completed_date)->format('Y-m-d'),
            'budget_required' => (float) $this->budget_required,
            'materials_needed' => $this->materials_needed,
            'documents_needed' => $this->documents_needed,
            'is_overdue' => (bool) $this->is_overdue,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'created_by' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->full_name,
                ];
            }),
            'assignees' => $this->whenLoaded('assignments', function () {
                return $this->assignments->map(function ($a) {
                    return [
                        'id' => $a->assignee->id ?? null,
                        'name' => $a->assignee->full_name ?? null,
                        'status' => $a->assignment_status,
                        'progress' => (int) ($a->progress_percentage ?? 0),
                    ];
                })->values();
            }),
        ];
    }
}
