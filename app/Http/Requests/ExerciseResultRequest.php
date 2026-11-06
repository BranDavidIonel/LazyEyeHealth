<?php

namespace App\Http\Requests;

use App\Support\ExerciseCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A result from an exercise page: { exercise: 'contrast', data: { thr: 0.012, ... } }.
 * "data" is free-form (each exercise measures other things), but only short keys
 * with numbers, short texts, booleans or small lists are kept.
 */
class ExerciseResultRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'exercise' => ['required', 'string', Rule::in(ExerciseCatalog::resultKeys())],
            'data' => ['required', 'array', 'max:40'],
        ];
    }

    /** @return array<string, mixed> */
    public function cleanData(): array
    {
        $clean = [];

        foreach ((array) $this->input('data') as $key => $value) {
            // These keys are set by the server.
            if (! is_string($key) || strlen($key) > 30 || in_array($key, ['id', 'g', 't', 'd'], true)) {
                continue;
            }

            $kept = $this->keep($value);

            if ($kept !== null) {
                $clean[$key] = $kept;
            }
        }

        return $clean;
    }

    private function keep(mixed $value, int $depth = 0): mixed
    {
        return match (true) {
            is_bool($value), is_int($value) => $value,
            is_float($value) => is_finite($value) ? $value : null,
            is_string($value) => mb_substr($value, 0, 200),
            is_array($value) && $depth < 2 => array_slice(
                array_filter(array_map(fn ($v) => $this->keep($v, $depth + 1), $value), fn ($v) => $v !== null),
                0,
                60,
                true,
            ),
            default => null,
        };
    }
}
