<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use App\Services\DailyPlanService;
use App\Services\ProgressService;
use App\Services\SettingsService;
use App\Services\VisionProgressService;
use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Home page: today's time and program, the last 14 days, exercises, vision progress. */
class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        ProgressService $progress,
        SettingsService $settings,
        DailyPlanService $plan,
        VisionProgressService $vision,
    ): Response {
        $user = $request->user();
        $today = CarbonImmutable::today();
        $goal = (int) $settings->for($user)['dailyGoalMin'];

        $journal = JournalEntry::query()
            ->where('user_id', $user->id)
            ->where('date', $today->toDateString())
            ->first();

        return Inertia::render('Dashboard', [
            'today' => [
                'date' => $today->toDateString(),
                'seconds' => $progress->todaySeconds($user),
                'goal_minutes' => $goal,
            ],
            'streak' => $progress->streak($user),
            'bestStreak' => $progress->bestStreak($user),
            'lastDays' => array_values(array_map(
                fn (array $day) => ['date' => $day['date'], 'total' => $day['total']],
                $progress->daily($user, $today->subDays(13), $today),
            )),
            'plan' => $plan->today($user),
            'exercises' => ExerciseCatalog::exercises(),
            'summaries' => $progress->exerciseSummaries($user),
            'vision' => $vision->comparisons($user),
            'journal' => $journal?->toClient(),
        ]);
    }
}
