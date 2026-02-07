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
            'status' => $this->status,
            'priority' => $this->priority,
            'deadline' => optional($this->deadline)->format('Y-m-d'),
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
