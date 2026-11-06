<?php

namespace App\Models;

use App\Enums\Eye;
use App\Enums\VisionTestType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One vision check for one eye.
 *
 * @property int $id
 * @property int $user_id
 * @property VisionTestType $type
 * @property Eye $eye
 * @property string $date day as Y-m-d (kept as text, same in SQLite and MySQL)
 * @property int $distance_cm
 * @property float $score logMAR (acuity, reading: lower = better) or logCS (contrast: higher = better)
 * @property array<string, mixed> $data
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'type', 'eye', 'date', 'distance_cm', 'score', 'data', 'note'])]
class VisionTest extends Model
{
    protected function casts(): array
    {
        return [
            'type' => VisionTestType::class,
            'eye' => Eye::class,
            'distance_cm' => 'integer',
            'score' => 'float',
            'data' => 'array',
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
            'id' => $this->id,
            'type' => $this->type->value,
            'eye' => $this->eye->value,
            'date' => $this->date,
            'time' => $this->created_at?->format('H:i'),
            'distance_cm' => $this->distance_cm,
            'score' => round($this->score, 3),
            'data' => $this->data,
            'note' => $this->note,
        ];
    }
}
