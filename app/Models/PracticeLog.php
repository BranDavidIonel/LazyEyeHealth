<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Seconds of practice of one user, on one day, in one exercise.
 *
 * @property int $id
 * @property int $user_id
 * @property string $date day as Y-m-d (kept as text, same in SQLite and MySQL)
 * @property string $exercise
 * @property int $seconds
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'date', 'exercise', 'seconds'])]
class PracticeLog extends Model
{
    protected function casts(): array
    {
        return [
            'seconds' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
