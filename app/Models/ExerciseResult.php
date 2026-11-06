<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Result of one finished round or game. "data" holds what the exercise
 * measured (e.g. contrast threshold, score, level).
 *
 * @property int $id
 * @property int $user_id
 * @property string $exercise
 * @property string $date day as Y-m-d (kept as text, same in SQLite and MySQL)
 * @property array<string, mixed> $data
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'exercise', 'date', 'data'])]
class ExerciseResult extends Model
{
    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Flat shape the exercise pages use: { g: exercise, t: timestamp in ms, d: day, ...data }.
     *
     * @return array<string, mixed>
     */
    public function toClient(): array
    {
        return [
            ...$this->data,
            'id' => $this->id,
            'g' => $this->exercise,
            't' => $this->created_at?->valueOf(),
            'd' => $this->date,
        ];
    }
}
