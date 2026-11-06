<?php

namespace App\Http\Requests;

use App\Enums\Eye;
use App\Enums\VisionTestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VisionTestRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(VisionTestType::class)],
            'eye' => ['required', Rule::enum(Eye::class)],
            'distance_cm' => ['required', 'integer', 'between:20,700'],
            // logMAR -0.5 .. 2 (acuity, reading) or logCS 0 .. 2.5 (contrast)
            'score' => ['required', 'numeric', 'between:-0.5,2.5'],
            'data' => ['required', 'array'],
            'data.lines' => ['sometimes', 'array', 'max:40'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
