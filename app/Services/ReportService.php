<?php

namespace App\Services;

use App\Models\ExerciseResult;
use App\Models\JournalEntry;
use App\Models\PracticeLog;
use App\Models\User;
use App\Models\VisionTest;
use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;

/**
 * Everything the Reports page shows for a period: time per day and exercise,
 * goal days, results of the exercises, vision tests and journal notes.
 */
class ReportService
{
    public function __construct(
        private ProgressService $progress,
        private SettingsService $settings,
    ) {}

    /**
     * The period from the query string: ?perioada=7|30|90|365|toate or ?luna=2026-11.
     *
     * @return array{from: CarbonImmutable, to: CarbonImmutable, key: string, label: string}
     */
    public function period(User $user, ?string $period, ?string $month): array
    {
        $today = CarbonImmutable::today();

        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $from = CarbonImmutable::createFromFormat('Y-m-d', $month.'-01')->startOfDay();
            $to = $from->endOfMonth()->startOfDay();

            return ['from' => $from, 'to' => $to->gt($today) ? $today : $to, 'key' => 'luna', 'label' => ucfirst($from->locale('ro')->translatedFormat('F Y'))];
        }

        if ($period === 'toate') {
            $first = PracticeLog::query()->where('user_id', $user->id)->min('date');
            $from = $first ? CarbonImmutable::parse(substr((string) $first, 0, 10)) : $today->subDays(29);

            return ['from' => $from->min($today->subDays(6)), 'to' => $today, 'key' => 'toate', 'label' => 'De la început'];
        }

        $days = in_array((int) $period, [7, 30, 90, 365], true) ? (int) $period : 30;

        return ['from' => $today->subDays($days - 1), 'to' => $today, 'key' => (string) $days, 'label' => "Ultimele {$days} de zile"];
    }

    /** @return array<string, mixed> */
    public function build(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $goalSeconds = (int) $this->settings->for($user)['dailyGoalMin'] * 60;
        $range = [$from->toDateString(), $to->toDateString()];

        $journal = JournalEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', $range)
            ->orderBy('date')
            ->get()
            ->keyBy(fn (JournalEntry $j) => substr((string) $j->date, 0, 10));

        $daily = [];

        foreach ($this->progress->daily($user, $from, $to) as $date => $day) {
            $entry = $journal->get($date);
            $daily[] = [
                ...$day,
                'patch_minutes' => $entry?->patch_minutes ?? 0,
                'goal_met' => $day['total'] >= $goalSeconds,
            ];
        }

        $totals = collect($daily)->reduce(function (array $carry, array $day) {
            foreach ($day['exercises'] as $slug => $seconds) {
                $carry[$slug] = ($carry[$slug] ?? 0) + $seconds;
            }

            return $carry;
        }, []);

        $activeDays = collect($daily)->filter(fn ($d) => $d['total'] > 0)->count();
        $totalSeconds = (int) collect($daily)->sum('total');

        $results = ExerciseResult::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', $range)
            ->orderBy('id')
            ->get()
            ->groupBy('exercise')
            ->map(fn ($group) => $group->take(-500)->map(fn (ExerciseResult $r) => $r->toClient())->values()->all())
            ->all();

        $perExercise = [];

        foreach (ExerciseCatalog::all() as $slug => $exercise) {
            if (! isset($totals[$slug]) && empty($results[$slug])) {
                continue;
            }

            $perExercise[] = [
                'slug' => $slug,
                'title' => $exercise['title'],
                'group' => $exercise['group'],
                'seconds' => $totals[$slug] ?? 0,
                'rounds' => count($results[$slug] ?? []),
            ];
        }

        if (isset($totals['test-vedere'])) {
            $perExercise[] = ['slug' => 'test-vedere', 'title' => 'Teste de vedere', 'group' => 'test', 'seconds' => $totals['test-vedere'], 'rounds' => 0];
        }

        usort($perExercise, fn ($a, $b) => $b['seconds'] <=> $a['seconds']);

        return [
            'goal_minutes' => intdiv($goalSeconds, 60),
            'kpis' => [
                'total_seconds' => $totalSeconds,
                'active_days' => $activeDays,
                'days' => count($daily),
                'goal_days' => collect($daily)->where('goal_met', true)->count(),
                'avg_active_seconds' => $activeDays ? intdiv($totalSeconds, $activeDays) : 0,
                'streak' => $this->progress->streak($user),
                'best_streak' => $this->progress->bestStreak($user),
                'patch_minutes' => (int) $journal->sum('patch_minutes'),
            ],
            'daily' => $daily,
            'per_exercise' => $perExercise,
            'results' => $results,
            'vision_tests' => VisionTest::query()
                ->where('user_id', $user->id)
                ->whereBetween('date', $range)
                ->orderBy('date')
                ->orderBy('id')
                ->get()
                ->map(fn (VisionTest $t) => $t->toClient())
                ->all(),
            'journal' => $journal->values()->map(fn (JournalEntry $j) => $j->toClient())->all(),
        ];
    }

    /**
     * CSV rows for the export (one row per day).
     *
     * @return list<list<string|int>>
     */
    public function csvRows(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $report = $this->build($user, $from, $to);
        $slugs = [...array_keys(ExerciseCatalog::all()), 'test-vedere'];
        $notes = collect($report['journal'])->keyBy('date');

        $rows = [['Data', 'Total minute', ...array_map(fn ($s) => ExerciseCatalog::title($s).' (min)', $slugs), 'Ocluzie în afara aplicației (min)', 'Obiectiv atins', 'Notă']];

        foreach ($report['daily'] as $day) {
            $rows[] = [
                $day['date'],
                round($day['total'] / 60, 1),
                ...array_map(fn ($s) => round(($day['exercises'][$s] ?? 0) / 60, 1), $slugs),
                $day['patch_minutes'],
                $day['goal_met'] ? 'da' : 'nu',
                (string) ($notes[$day['date']]['note'] ?? ''),
            ];
        }

        return $rows;
    }
}
