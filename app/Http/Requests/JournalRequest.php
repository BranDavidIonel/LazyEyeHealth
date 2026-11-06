<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JournalRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'patch_minutes' => ['required', 'integer', 'between:0,1440'],
            'eye_comfort' => ['nullable', 'integer', 'between:1,5'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
