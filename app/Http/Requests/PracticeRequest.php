<?php

namespace App\Http\Requests;

use App\Support\ExerciseCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PracticeRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'exercise' => ['required', 'string', Rule::in(ExerciseCatalog::practiceKeys())],
            'seconds' => ['required', 'integer', 'min:1', 'max:'.config('eye.heartbeat_max_seconds')],
        ];
    }
}
