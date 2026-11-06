<?php

namespace App\Services;

use App\Models\ExerciseResult;
use App\Models\PracticeLog;
use App\Models\User;
use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Practice time per day, streaks and the latest results of every exercise.
 */
class ProgressService
{
    /** Adds seconds to today's time for an exercise; returns today's total for all exercises. */
    public function addSeconds(User $user, string $exercise, int $seconds): int
    {
        $today = today()->toDateString();

        DB::transaction(function () use ($user, $exercise, $seconds, $today) {
            $log = PracticeLog::query()->firstOrCreate(
                ['user_id' => $user->id, 'date' => $today, 'exercise' => $exercise],
                ['seconds' => 0],
            );
            $log->increment('seconds', $seconds);
        });

        return $this->secondsOn($user, $today);
    }

    public function secondsOn(User $user, string $date): int
    {
        return (int) PracticeLog::query()
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->sum('seconds');
    }

    public function todaySeconds(User $user): int
    {
        return $this->secondsOn($user, today()->toDateString());
    }

    /**
     * Seconds per day and exercise between two dates (days without practice included).
     *
     * @return array<string, array{date: string, total: int, exercises: array<string, int>}>
     */
    public function daily(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $days = [];

        for ($d = $from; $d->lte($to); $d = $d->addDay()) {
            $days[$d->toDateString()] = ['date' => $d->toDateString(), 'total' => 0, 'exercises' => []];
        }

        $rows = PracticeLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get(['date', 'exercise', 'seconds']);

        foreach ($rows as $row) {
            $key = substr((string) $row->date, 0, 10);

            if (! isset($days[$key])) {
                continue;
            }

            $days[$key]['total'] += $row->seconds;
            $days[$key]['exercises'][$row->exercise] = ($days[$key]['exercises'][$row->exercise] ?? 0) + $row->seconds;
        }

        return $days;
    }

    /**
     * Total seconds of every day the user practiced (date => seconds).
     *
     * @return array<string, int>
     */
    public function practiceDays(User $user): array
    {
        return PracticeLog::query()
            ->where('user_id', $user->id)
            ->selectRaw('date, SUM(seconds) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date')
            ->mapWithKeys(fn ($total, $date) => [substr((string) $date, 0, 10) => (int) $total])
            ->all();
    }

    /** Consecutive days with at least 5 minutes, up to today (today may still be in progress). */
    public function streak(User $user): int
    {
        $days = $this->practiceDays($user);
        $min = (int) config('eye.streak_min_seconds');
        $day = CarbonImmutable::today();

        if (($days[$day->toDateString()] ?? 0) < $min) {
            $day = $day->subDay();
        }

        $count = 0;

        while (($days[$day->toDateString()] ?? 0) >= $min) {
            $count++;
            $day = $day->subDay();
        }

        return $count;
    }

    /** Longest run of consecutive days with at least 5 minutes. */
    public function bestStreak(User $user): int
    {
        $min = (int) config('eye.streak_min_seconds');
        $best = 0;
        $run = 0;
        $previous = null;

        foreach ($this->practiceDays($user) as $date => $total) {
            if ($total < $min) {
                continue;
            }

            $day = CarbonImmutable::parse($date);
            $run = $previous && $previous->addDay()->isSameDay($day) ? $run + 1 : 1;
            $best = max($best, $run);
            $previous = $day;
        }

        return $best;
    }

    /**
     * Per exercise: number of results, the last one and the best score (for the cards).
     *
     * @return array<string, array{count: int, last: array<string, mixed>|null, best: float|int|null, minutes: int}>
     */
    public function exerciseSummaries(User $user): array
    {
        $minutes = PracticeLog::query()
            ->where('user_id', $user->id)
            ->selectRaw('exercise, SUM(seconds) as total')
            ->groupBy('exercise')
            ->pluck('total', 'exercise');

        $out = [];

        foreach (array_keys(ExerciseCatalog::all()) as $slug) {
            $query = ExerciseResult::query()->where('user_id', $user->id)->where('exercise', $slug);
            $last = (clone $query)->latest('id')->first();
            $best = null;

            foreach ((clone $query)->latest('id')->limit(500)->get(['data']) as $result) {
                $score = $result->data['score'] ?? null;

                if (is_numeric($score)) {
                    $best = max($best ?? $score, $score);
                }
            }

            $out[$slug] = [
                'count' => (clone $query)->count(),
                'last' => $last?->toClient(),
                'best' => $best,
                'minutes' => intdiv((int) ($minutes[$slug] ?? 0), 60),
            ];
        }

        return $out;
    }

    /**
     * Recent results of the given series, oldest first (for the exercise pages).
     *
     * @param  list<string>  $keys
     * @return array<string, list<array<string, mixed>>>
     */
    public function recentResults(User $user, array $keys, int $limit = 300): array
    {
        $out = [];

        foreach ($keys as $key) {
            $out[$key] = ExerciseResult::query()
                ->where('user_id', $user->id)
                ->where('exercise', $key)
                ->latest('id')
                ->limit($limit)
                ->get()
                ->reverse()
                ->map(fn (ExerciseResult $r) => $r->toClient())
                ->values()
                ->all();
        }

        return $out;
    }
}
