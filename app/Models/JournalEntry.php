<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Daily journal: minutes with the patch outside the app, eye comfort (1-5), note.
 *
 * @property int $id
 * @property int $user_id
 * @property string $date day as Y-m-d (kept as text, same in SQLite and MySQL)
 * @property int $patch_minutes
 * @property int|null $eye_comfort
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'date', 'patch_minutes', 'eye_comfort', 'note'])]
class JournalEntry extends Model
{
    protected function casts(): array
    {
        return [
            'patch_minutes' => 'integer',
            'eye_comfort' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, mixed> */
    public function toClient(): array
    {
        return [
            'date' => $this->date,
            'patch_minutes' => $this->patch_minutes,
            'eye_comfort' => $this->eye_comfort,
            'note' => $this->note,
        ];
    }
}
