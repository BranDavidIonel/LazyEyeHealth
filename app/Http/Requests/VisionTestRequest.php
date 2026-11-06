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
            // Free-form details of the test (lines, letters, speeds...); only its size is limited.
            'data' => ['required', 'array', function (string $attribute, mixed $value, \Closure $fail) {
                if (strlen((string) json_encode($value)) > 20000) {
                    $fail('The test details are too large.');
                }
            }],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * The test details as sent. (validated() would keep only the keys that have
     * their own rule, and "data" has none inside.)
     *
     * @return array<string, mixed>
     */
    public function details(): array
    {
        return (array) $this->input('data', []);
    }
}
