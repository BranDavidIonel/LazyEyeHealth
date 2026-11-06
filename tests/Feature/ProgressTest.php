<?php

namespace Tests\Feature;

use App\Models\PracticeLog;
use App\Models\User;
use App\Models\VisionTest;
use App\Services\DailyPlanService;
use App\Services\ProgressService;
use App\Services\SettingsService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    private const TODAY = '2026-11-06';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse(self::TODAY.' 12:00:00'));
    }

    /** Practice seconds on the day $daysAgo days before today. */
    private function practice(User $user, int $daysAgo, int $seconds, string $exercise = 'tetris'): void
    {
        PracticeLog::query()->create([
            'user_id' => $user->id,
            'date' => CarbonImmutable::parse(self::TODAY)->subDays($daysAgo)->toDateString(),
            'exercise' => $exercise,
            'seconds' => $seconds,
        ]);
    }

    private function progress(): ProgressService
    {
        return app(ProgressService::class);
    }

    /* ---------- streaks ---------- */

    public function test_no_practice_no_streak(): void
    {
        $user = User::factory()->create();

        $this->assertSame(0, $this->progress()->streak($user));
        $this->assertSame(0, $this->progress()->bestStreak($user));
    }

    public function test_today_in_progress_does_not_break_the_streak(): void
    {
        $user = User::factory()->create();
        $this->practice($user, 0, 100);   // today, not 5 minutes yet
        $this->practice($user, 1, 300);
        $this->practice($user, 2, 400);
        $this->practice($user, 4, 500);   // day 3 is missing

        $this->assertSame(2, $this->progress()->streak($user));
    }

    public function test_today_counts_once_it_has_5_minutes(): void
    {
        $user = User::factory()->create();
        $this->practice($user, 0, 200, 'tetris');
        $this->practice($user, 0, 100, 'vernier');   // 300 s over two exercises
        $this->practice($user, 1, 300);

        $this->assertSame(2, $this->progress()->streak($user));
    }

    public function test_a_short_yesterday_ends_the_streak(): void
    {
        $user = User::factory()->create();
        $this->practice($user, 1, 299);
        $this->practice($user, 2, 900);
        $this->practice($user, 3, 900);

        $this->assertSame(0, $this->progress()->streak($user));
        $this->assertSame(2, $this->progress()->bestStreak($user));
    }

    public function test_the_best_streak_is_the_longest_run(): void
    {
        $user = User::factory()->create();

        foreach ([20, 19, 18, 17] as $daysAgo) {
            $this->practice($user, $daysAgo, 600);   // 4 days in a row
        }

        $this->practice($user, 16, 100);   // too short: breaks the run
        $this->practice($user, 15, 600);
        $this->practice($user, 2, 600);
        $this->practice($user, 1, 600);
        $this->practice($user, 0, 600);

        $this->assertSame(4, $this->progress()->bestStreak($user));
        $this->assertSame(3, $this->progress()->streak($user));
    }

    public function test_streaks_only_count_the_users_own_days(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->practice($other, 1, 600);
        $this->practice($other, 2, 600);

        $this->assertSame(0, $this->progress()->streak($user));
    }

    public function test_the_threshold_comes_from_the_config(): void
    {
        config(['eye.streak_min_seconds' => 60]);
        $user = User::factory()->create();
        $this->practice($user, 1, 60);

        $this->assertSame(1, $this->progress()->streak($user));
    }

    public function test_daily_fills_the_days_without_practice(): void
    {
        $user = User::factory()->create();
        $this->practice($user, 1, 120, 'tetris');
        $this->practice($user, 1, 60, 'vernier');

        $days = $this->progress()->daily($user, CarbonImmutable::parse('2026-11-03'), CarbonImmutable::parse(self::TODAY));

        $this->assertSame(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'], array_keys($days));
        $this->assertSame(['date' => '2026-11-03', 'total' => 0, 'exercises' => []], $days['2026-11-03']);
        $this->assertSame(180, $days['2026-11-05']['total']);
        $this->assertSame(['tetris' => 120, 'vernier' => 60], $days['2026-11-05']['exercises']);
    }

    /* ---------- today's plan ---------- */

    public function test_the_plan_starts_with_the_calibration_and_asks_for_a_first_test(): void
    {
        $user = User::factory()->create();

        $plan = app(DailyPlanService::class)->today($user);

        $this->assertSame('setup', $plan[0]['kind']);
        $this->assertSame('calibrare', $plan[0]['slug']);
        $this->assertSame('/calibrare', $plan[0]['url']);
        $this->assertSame('Calibrare', $plan[0]['title']);

        $test = collect($plan)->firstWhere('kind', 'test');
        $this->assertNotNull($test);
        $this->assertSame('/test-vedere/acuity', $test['url']);
        $this->assertSame('Testul săptămânal de vedere', $test['title']);

        $kinds = array_column($plan, 'kind');
        $this->assertContains('dichoptic', $kinds);
        $this->assertContains('mono', $kinds);
        $this->assertTrue(in_array('stereo', $kinds, true) || in_array('vergence', $kinds, true));
    }

    public function test_the_plan_has_no_calibration_once_calibrated(): void
    {
        $user = User::factory()->create();
        app(SettingsService::class)->update($user, ['calibrated' => true]);

        $kinds = array_column(app(DailyPlanService::class)->today($user->fresh()), 'kind');

        $this->assertNotContains('setup', $kinds);
    }

    public function test_the_weekly_test_reminder_follows_the_last_acuity_test(): void
    {
        $user = User::factory()->create();
        $plan = app(DailyPlanService::class);
        $acuity = fn (int $daysAgo, string $type = 'acuity') => VisionTest::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'eye' => 'right',
            'date' => CarbonImmutable::parse(self::TODAY)->subDays($daysAgo)->toDateString(),
            'distance_cm' => 150,
            'score' => 0.3,
            'data' => [],
        ]);

        // a contrast test does not count as the weekly letter chart
        $acuity(1, 'contrast');
        $this->assertNotNull(collect($plan->today($user))->firstWhere('kind', 'test'));

        $acuity(8);
        $reminder = collect($plan->today($user))->firstWhere('kind', 'test');
        $this->assertNotNull($reminder);
        $this->assertStringContainsString('8', $reminder['text']);

        $acuity(3);
        $this->assertNull(collect($plan->today($user))->firstWhere('kind', 'test'));
    }

    public function test_a_step_is_done_after_5_minutes_of_that_exercise_today(): void
    {
        $user = User::factory()->create();
        $service = app(DailyPlanService::class);

        $game = collect($service->today($user))->firstWhere('kind', 'dichoptic');
        $this->assertFalse($game['done']);
        $this->assertSame('/exercitii/'.$game['slug'], $game['url']);

        $this->practice($user, 0, 299, $game['slug']);
        $this->assertFalse(collect($service->today($user))->firstWhere('kind', 'dichoptic')['done']);

        PracticeLog::query()->where('user_id', $user->id)->increment('seconds', 1);
        $this->assertTrue(collect($service->today($user))->firstWhere('kind', 'dichoptic')['done']);
    }

    public function test_the_plan_changes_from_day_to_day(): void
    {
        $user = User::factory()->create();
        $service = app(DailyPlanService::class);
        $slugs = [];

        foreach (range(0, 5) as $offset) {
            $this->travelTo(CarbonImmutable::parse(self::TODAY.' 12:00:00')->addDays($offset));
            $slugs[] = collect($service->today($user))->firstWhere('kind', 'mono')['slug'];
        }

        $this->assertGreaterThan(1, count(array_unique($slugs)));
    }
}
