<?php

namespace App\Services;

use App\Enums\Eye;
use App\Enums\VisionTestType;
use App\Models\User;
use App\Models\VisionTest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Did the vision really get better? Compares the latest vision test with the
 * one from about a month earlier, per test type and eye.
 *
 * Tests from the same day are averaged (two tests in a row are more reliable
 * than one). A change smaller than the test's noise (about 1 line on a
 * letter chart) is reported as "stable": it can come from tiredness, light
 * or luck. Two lines or more is a sure change.
 */
class VisionProgressService
{
    /** Days between the two compared tests: ideally 30, accepted 20 - 45. */
    private const TARGET_DAYS = 30;

    private const MIN_DAYS = 20;

    private const MAX_DAYS = 45;

    /**
     * Day averages per type and eye, oldest first.
     *
     * @return array<string, array<string, list<array{date: string, score: float, count: int, extra: array<string, float|null>}>>>
     */
    public function series(User $user): array
    {
        $tests = VisionTest::query()
            ->where('user_id', $user->id)
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $out = [];

        foreach ($tests->groupBy(fn (VisionTest $t) => $t->type->value.'|'.$t->eye->value) as $key => $group) {
            [$type, $eye] = explode('|', $key);

            $out[$type][$eye] = $group
                ->groupBy('date')
                ->map(fn (Collection $day, string $date) => [
                    'date' => $date,
                    'score' => round((float) $day->avg('score'), 3),
                    'count' => $day->count(),
                    'extra' => $this->extras($day),
                ])
                ->values()
                ->all();
        }

        return $out;
    }

    /**
     * One comparison per type and eye that has at least one test.
     *
     * @return list<array<string, mixed>>
     */
    public function comparisons(User $user): array
    {
        $out = [];

        foreach ($this->series($user) as $type => $eyes) {
            $testType = VisionTestType::from($type);

            foreach ($eyes as $eye => $days) {
                $out[] = $this->compare($testType, Eye::from($eye), $days);
            }
        }

        // Lazy eye first, then the good eye, then both; acuity before reading before contrast.
        $typeOrder = ['acuity' => 0, 'reading' => 1, 'contrast' => 2];
        $eyeOrder = ['right' => 0, 'left' => 1, 'both' => 2];
        usort($out, fn ($a, $b) => [$typeOrder[$a['type']], $eyeOrder[$a['eye']]] <=> [$typeOrder[$b['type']], $eyeOrder[$b['eye']]]);

        return $out;
    }

    /**
     * @param  list<array{date: string, score: float, count: int, extra: array<string, float|null>}>  $days
     * @return array<string, mixed>
     */
    public function compare(VisionTestType $type, Eye $eye, array $days): array
    {
        $latest = end($days);
        $latestDate = CarbonImmutable::parse($latest['date']);
        $baseline = null;
        $approximate = false;

        // The day closest to 30 days before the latest test, within 20 - 45 days.
        foreach ($days as $day) {
            $gap = (int) CarbonImmutable::parse($day['date'])->diffInDays($latestDate);

            if ($gap < self::MIN_DAYS || $gap > self::MAX_DAYS) {
                continue;
            }

            if (! $baseline || abs($gap - self::TARGET_DAYS) < abs($baseline['gap'] - self::TARGET_DAYS)) {
                $baseline = [...$day, 'gap' => $gap];
            }
        }

        // No test a month earlier: compare with the first test that is at least a week older.
        if (! $baseline) {
            foreach ($days as $day) {
                $gap = (int) CarbonImmutable::parse($day['date'])->diffInDays($latestDate);

                if ($gap >= 7) {
                    $baseline = [...$day, 'gap' => $gap];
                    $approximate = true;
                    break;
                }
            }
        }

        $first = $days[0];

        return [
            'type' => $type->value,
            'type_label' => $type->label(),
            'eye' => $eye->value,
            'eye_label' => $eye->label(),
            'lower_is_better' => $type->lowerIsBetter(),
            'noise' => $type->noise(),
            'latest' => $latest,
            'baseline' => $baseline,
            'approximate' => $approximate,
            'tests' => count($days),
            'month' => $baseline ? $this->delta($type, $baseline, $latest) : null,
            'since_start' => count($days) > 1 ? $this->delta($type, $first, $latest) : null,
            'first' => $first,
        ];
    }

    /**
     * How much better (positive) or worse (negative) the newer test is.
     *
     * @param  array{score: float, extra?: array<string, float|null>}  $old
     * @param  array{score: float, extra?: array<string, float|null>}  $new
     * @return array<string, mixed>
     */
    public function delta(VisionTestType $type, array $old, array $new): array
    {
        $gain = $type->lowerIsBetter() ? $old['score'] - $new['score'] : $new['score'] - $old['score'];
        $gain = round($gain, 3);
        $noise = $type->noise();

        $verdict = match (true) {
            $gain >= 2 * $noise - 1e-9 => 'better',
            $gain >= $noise - 1e-9 => 'maybe_better',
            $gain <= -2 * $noise + 1e-9 => 'worse',
            $gain <= -$noise + 1e-9 => 'maybe_worse',
            default => 'stable',
        };

        $result = [
            'gain' => $gain,
            // logMAR: 0.1 = one line of 5 letters, 0.02 = one letter. Contrast: 0.15 = one triplet.
            'lines' => $type === VisionTestType::Contrast ? round($gain / 0.15, 1) : round($gain / 0.1, 1),
            'letters' => $type === VisionTestType::Contrast ? (int) round($gain / 0.05) : (int) round($gain / 0.02),
            'verdict' => $verdict,
        ];

        // Reading: also the change of the best reading speed.
        $oldSpeed = $old['extra']['max_wpm'] ?? null;
        $newSpeed = $new['extra']['max_wpm'] ?? null;

        if ($oldSpeed && $newSpeed) {
            $result['speed_change_pct'] = (int) round(($newSpeed - $oldSpeed) / $oldSpeed * 100);
        }

        return $result;
    }

    /**
     * Averages of the extra numbers of a day (reading speed, critical print size).
     *
     * @param  Collection<int, VisionTest>  $day
     * @return array<string, float|null>
     */
    private function extras(Collection $day): array
    {
        $avg = function (string $key) use ($day): ?float {
            $values = $day->map(fn (VisionTest $t) => $t->data[$key] ?? null)->filter(fn ($v) => is_numeric($v));

            return $values->isEmpty() ? null : round((float) $values->avg(), 3);
        };

        return [
            'max_wpm' => $avg('max_wpm'),
            'cps' => $avg('cps'),
            'letters' => $avg('letters_correct'),
        ];
    }
}
