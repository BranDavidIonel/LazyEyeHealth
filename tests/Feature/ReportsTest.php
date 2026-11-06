<?php

namespace Tests\Feature;

use App\Models\ExerciseResult;
use App\Models\JournalEntry;
use App\Models\PracticeLog;
use App\Models\User;
use App\Services\ReportService;
use App\Services\SettingsService;
use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private const TODAY = '2026-11-06';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse(self::TODAY.' 12:00:00'));
    }

    private function reports(): ReportService
    {
        return app(ReportService::class);
    }

    private function practice(User $user, string $date, int $seconds, string $exercise = 'tetris'): void
    {
        PracticeLog::query()->create(['user_id' => $user->id, 'date' => $date, 'exercise' => $exercise, 'seconds' => $seconds]);
    }

    /* ---------- period ---------- */

    public function test_periods_of_days(): void
    {
        $user = User::factory()->create();

        foreach (['7' => '2026-10-31', '30' => '2026-10-08', '90' => '2026-08-09', '365' => '2025-11-07'] as $days => $from) {
            $p = $this->reports()->period($user, (string) $days, null);
            $this->assertSame((string) $days, $p['key']);
            $this->assertSame($from, $p['from']->toDateString());
            $this->assertSame(self::TODAY, $p['to']->toDateString());
        }

        $this->assertSame('Ultimele 30 de zile', $this->reports()->period($user, '30', null)['label']);
        $this->assertSame('Ultimele 365 de zile', $this->reports()->period($user, '365', null)['label']);
    }

    /**
     * Known bug (reported): lang/ro.json has "Last :days days" => "Ultimele :days de zile",
     * but Romanian puts "de" only from 20 up: "Ultimele 7 zile", "Ultimele 30 de zile".
     */
    public function test_the_7_day_label_is_correct_romanian(): void
    {
        $this->assertSame('Ultimele 7 zile', $this->reports()->period(User::factory()->create(), '7', null)['label']);
    }

    public function test_an_unknown_period_falls_back_to_30_days(): void
    {
        $user = User::factory()->create();

        foreach (['13', 'abc', null, ''] as $value) {
            $this->assertSame('30', $this->reports()->period($user, $value, null)['key']);
        }

        // a month in the wrong format is ignored too
        $this->assertSame('30', $this->reports()->period($user, null, '2026-1')['key']);
        $this->assertSame('30', $this->reports()->period($user, null, 'october')['key']);
    }

    public function test_a_past_month(): void
    {
        $p = $this->reports()->period(User::factory()->create(), '7', '2026-10');

        $this->assertSame('luna', $p['key']);
        $this->assertSame('2026-10-01', $p['from']->toDateString());
        $this->assertSame('2026-10-31', $p['to']->toDateString());
        $this->assertSame('Octombrie 2026', $p['label']);
    }

    public function test_the_current_month_ends_today(): void
    {
        $p = $this->reports()->period(User::factory()->create(), null, '2026-11');

        $this->assertSame('2026-11-01', $p['from']->toDateString());
        $this->assertSame(self::TODAY, $p['to']->toDateString());
    }

    public function test_the_month_label_follows_the_language(): void
    {
        app()->setLocale('en');

        $this->assertSame('October 2026', $this->reports()->period(User::factory()->create(), null, '2026-10')['label']);
    }

    public function test_since_the_start(): void
    {
        $user = User::factory()->create();
        $this->practice($user, '2026-08-15', 600);

        $p = $this->reports()->period($user, 'toate', null);

        $this->assertSame('toate', $p['key']);
        $this->assertSame('2026-08-15', $p['from']->toDateString());
        $this->assertSame(self::TODAY, $p['to']->toDateString());
        $this->assertSame('De la început', $p['label']);
    }

    public function test_since_the_start_shows_at_least_a_week(): void
    {
        $user = User::factory()->create();
        $this->practice($user, '2026-11-05', 600);

        $this->assertSame('2026-10-31', $this->reports()->period($user, 'toate', null)['from']->toDateString());
        // without any practice: the last 30 days
        $this->assertSame('2026-10-08', $this->reports()->period(User::factory()->create(), 'toate', null)['from']->toDateString());
    }

    /* ---------- report ---------- */

    public function test_the_report_has_a_row_for_every_day(): void
    {
        $user = User::factory()->create();
        app(SettingsService::class)->update($user, ['dailyGoalMin' => 10]);
        $this->practice($user, '2026-11-02', 600, 'tetris');      // goal met (10 min)
        $this->practice($user, '2026-11-04', 300, 'tetris');
        $this->practice($user, '2026-11-04', 200, 'vernier');     // 500 s: not the goal
        $this->practice($user, '2026-11-05', 700, 'test-vedere');
        $this->practice($user, '2026-10-20', 9999, 'tetris');     // before the period
        $this->practice(User::factory()->create(), '2026-11-03', 5000);
        JournalEntry::query()->create(['user_id' => $user->id, 'date' => '2026-11-04', 'patch_minutes' => 45, 'note' => 'ok']);
        ExerciseResult::query()->create(['user_id' => $user->id, 'exercise' => 'vernier', 'date' => '2026-11-04', 'data' => ['arcsec' => 30]]);

        $report = $this->reports()->build($user->fresh(), CarbonImmutable::parse('2026-10-31'), CarbonImmutable::parse(self::TODAY));

        $this->assertSame(10, $report['goal_minutes']);
        $this->assertCount(7, $report['daily']);
        $this->assertSame('2026-10-31', $report['daily'][0]['date']);
        $this->assertSame(0, $report['daily'][0]['total']);
        $this->assertFalse($report['daily'][0]['goal_met']);

        $byDate = collect($report['daily'])->keyBy('date');
        $this->assertTrue($byDate['2026-11-02']['goal_met']);
        $this->assertFalse($byDate['2026-11-04']['goal_met']);
        $this->assertSame(500, $byDate['2026-11-04']['total']);
        $this->assertSame(45, $byDate['2026-11-04']['patch_minutes']);
        $this->assertSame(0, $byDate['2026-11-03']['total']);

        $this->assertSame([
            'total_seconds' => 1800,
            'active_days' => 3,
            'days' => 7,
            'goal_days' => 2,
            'avg_active_seconds' => 600,
            'streak' => 2,          // yesterday and the day before
            'best_streak' => 2,
            'patch_minutes' => 45,
        ], $report['kpis']);

        $this->assertSame(['tetris', 'test-vedere', 'vernier'], array_column($report['per_exercise'], 'slug'));
        $this->assertSame(900, $report['per_exercise'][0]['seconds']);
        $this->assertSame(1, collect($report['per_exercise'])->firstWhere('slug', 'vernier')['rounds']);
        $this->assertSame(30, $report['results']['vernier'][0]['arcsec']);
        $this->assertCount(1, $report['journal']);
    }

    /* ---------- CSV ---------- */

    public function test_the_csv_export(): void
    {
        $user = $this->signIn();
        $this->practice($user, '2026-11-05', 1800, 'tetris');
        $this->practice($user, '2026-11-05', 90, 'vernier');
        JournalEntry::query()->create(['user_id' => $user->id, 'date' => '2026-11-05', 'patch_minutes' => 30, 'note' => 'ochi; obosiți']);

        $response = $this->get('/rapoarte/export?perioada=7');

        $response->assertOk()->assertDownload('lazyeyehealth-2026-10-31_2026-11-06.csv');
        $this->assertStringStartsWith('text/csv', $response->headers->get('Content-Type'));

        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);

        $lines = preg_split('/\r?\n/', trim(substr($csv, 3)));
        $this->assertCount(8, $lines);   // header + 7 days

        $header = str_getcsv($lines[0], ';', '"', '');
        $this->assertSame('Data', $header[0]);
        $this->assertSame('Total minute', $header[1]);
        $this->assertSame('Obiectiv atins', $header[count($header) - 2]);
        $this->assertContains('Tetris dihoptic (min)', $header);

        $row = str_getcsv($lines[6], ';', '"', '');
        $this->assertSame('2026-11-05', $row[0]);
        $this->assertSame('31.5', $row[1]);
        $this->assertSame('30', $row[array_search('Tetris dihoptic (min)', $header, true)]);
        $this->assertSame('1.5', $row[array_search(ExerciseCatalog::title('vernier').' (min)', $header, true)]);
        $this->assertSame('da', $row[count($row) - 2]);
        $this->assertSame('ochi; obosiți', $row[count($row) - 1]);
        $this->assertCount(count($header), $row);

        $this->assertSame('nu', str_getcsv($lines[1], ';', '"', '')[count($header) - 2]);
    }

    public function test_the_csv_export_for_a_month(): void
    {
        $this->signIn();

        $this->get('/rapoarte/export?luna=2026-10')
            ->assertOk()
            ->assertDownload('lazyeyehealth-2026-10-01_2026-10-31.csv');
    }
}
