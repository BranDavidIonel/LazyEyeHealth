<?php

namespace Tests\Feature;

use App\Models\ExerciseResult;
use App\Models\JournalEntry;
use App\Models\PracticeLog;
use App\Services\ProgressService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PracticeAndResultsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-06 12:00:00'));
    }

    /* ---------- practice time ---------- */

    public function test_practice_seconds_are_added_to_todays_row(): void
    {
        $user = $this->signIn();

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 15])
            ->assertOk()
            ->assertExactJson(['today_seconds' => 15]);

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 20])
            ->assertOk()
            ->assertExactJson(['today_seconds' => 35]);

        $this->assertSame(1, PracticeLog::query()->count());
        $this->assertDatabaseHas('practice_logs', [
            'user_id' => $user->id,
            'exercise' => 'tetris',
            'seconds' => 35,
        ]);
        $this->assertSame('2026-11-06', substr((string) PracticeLog::query()->value('date'), 0, 10));
    }

    public function test_today_seconds_is_the_total_of_all_exercises(): void
    {
        $this->signIn();

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 60]);
        $this->postJson('/api/practice', ['exercise' => 'vernier', 'seconds' => 30])
            ->assertExactJson(['today_seconds' => 90]);
        $this->postJson('/api/practice', ['exercise' => 'test-vedere', 'seconds' => 10])
            ->assertExactJson(['today_seconds' => 100]);

        $this->assertSame(3, PracticeLog::query()->count());
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('todaySeconds', 100)
            ->where('today.seconds', 100));
    }

    public function test_a_new_day_starts_a_new_row(): void
    {
        $this->signIn();

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 60]);
        $this->travelTo(CarbonImmutable::parse('2026-11-07 09:00:00'));
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 20])
            ->assertExactJson(['today_seconds' => 20]);

        $this->assertSame(2, PracticeLog::query()->count());
    }

    public function test_practice_of_one_user_does_not_count_for_another(): void
    {
        $this->signIn();
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 100]);

        $this->signIn();
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 5])
            ->assertExactJson(['today_seconds' => 5]);
    }

    public function test_practice_rejects_an_unknown_exercise(): void
    {
        $this->signIn();

        $this->postJson('/api/practice', ['exercise' => 'minecraft', 'seconds' => 15])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('exercise');

        $this->assertSame(0, PracticeLog::query()->count());
    }

    public function test_practice_rejects_too_many_or_too_few_seconds(): void
    {
        $this->signIn();
        $max = (int) config('eye.heartbeat_max_seconds');

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => $max + 1])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('seconds');
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 0])
            ->assertJsonValidationErrors('seconds');
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 'a lot'])
            ->assertJsonValidationErrors('seconds');
        $this->postJson('/api/practice', ['exercise' => 'tetris'])
            ->assertJsonValidationErrors('seconds');

        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => $max])
            ->assertOk()
            ->assertExactJson(['today_seconds' => $max]);
    }

    /* ---------- exercise results ---------- */

    public function test_a_result_is_stored_with_its_data(): void
    {
        $user = $this->signIn();

        $response = $this->postJson('/api/results', [
            'exercise' => 'vernier',
            'data' => ['px' => 1.5, 'arcsec' => 30.2, 'trials' => 60, 'acc' => 0.8, 'mode' => 'anaglyph', 'atFloor' => false],
        ]);

        $response->assertCreated()
            ->assertJsonPath('result.g', 'vernier')
            ->assertJsonPath('result.d', '2026-11-06')
            ->assertJsonPath('result.px', 1.5)
            ->assertJsonPath('result.mode', 'anaglyph');
        // milliseconds, like Date.now() in the browser
        $this->assertEquals(CarbonImmutable::parse('2026-11-06 12:00:00')->getTimestampMs(), $response->json('result.t'));

        $result = ExerciseResult::query()->firstOrFail();
        $this->assertSame($user->id, $result->user_id);
        $this->assertSame('vernier', $result->exercise);
        $this->assertSame(
            ['px' => 1.5, 'arcsec' => 30.2, 'trials' => 60, 'acc' => 0.8, 'mode' => 'anaglyph', 'atFloor' => false],
            $result->data,
        );
    }

    public function test_reserved_keys_and_junk_are_stripped(): void
    {
        $this->signIn();

        $this->postJson('/api/results', [
            'exercise' => 'tetris',
            'data' => [
                'score' => 1200,
                'id' => 999,
                'g' => 'other',
                't' => 1,
                'd' => '2020-01-01',
                'nothing' => null,
                str_repeat('k', 31) => 1,
                'long' => str_repeat('a', 300),
                'list' => [1, 2, 3],
                'deep' => ['a' => ['b' => ['c' => 1]], 'x' => 2],
            ],
        ])->assertCreated();

        $data = ExerciseResult::query()->firstOrFail()->data;

        $this->assertSame(1200, $data['score']);
        $this->assertArrayNotHasKey('id', $data);
        $this->assertArrayNotHasKey('g', $data);
        $this->assertArrayNotHasKey('t', $data);
        $this->assertArrayNotHasKey('d', $data);
        $this->assertArrayNotHasKey('nothing', $data);
        $this->assertArrayNotHasKey(str_repeat('k', 31), $data);
        $this->assertSame(200, mb_strlen($data['long']));
        $this->assertSame([1, 2, 3], $data['list']);
        // two levels are kept, the third is dropped
        $this->assertSame(['a' => [], 'x' => 2], $data['deep']);
    }

    public function test_the_client_shape_keeps_the_server_values_for_reserved_keys(): void
    {
        $this->signIn();

        $response = $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 5, 'g' => 'fake', 'd' => 'fake']]);

        $response->assertJsonPath('result.g', 'tetris')
            ->assertJsonPath('result.d', '2026-11-06')
            ->assertJsonPath('result.id', ExerciseResult::query()->value('id'));
    }

    public function test_results_reject_an_unknown_exercise_or_missing_data(): void
    {
        $this->signIn();

        $this->postJson('/api/results', ['exercise' => 'chess', 'data' => ['score' => 1]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('exercise');
        $this->postJson('/api/results', ['exercise' => 'tetris'])
            ->assertJsonValidationErrors('data');
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => 'text'])
            ->assertJsonValidationErrors('data');

        $this->assertSame(0, ExerciseResult::query()->count());
    }

    public function test_extra_series_are_accepted(): void
    {
        $this->signIn();

        $this->postJson('/api/results', ['exercise' => 'balance', 'data' => ['v' => 0.35, 'reason' => 'manual']])->assertCreated();
        $this->postJson('/api/results', ['exercise' => 'worth', 'data' => ['seen' => 4]])->assertCreated();

        $this->assertSame(2, ExerciseResult::query()->count());
    }

    public function test_recent_results_are_flat_and_oldest_first(): void
    {
        $user = $this->signIn();

        foreach ([10, 20, 30] as $score) {
            $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => $score]])->assertCreated();
        }

        $this->postJson('/api/results', ['exercise' => 'breakout', 'data' => ['score' => 99]]);

        $service = app(ProgressService::class);
        $results = $service->recentResults($user, ['tetris', 'balance']);

        $this->assertSame(['tetris', 'balance'], array_keys($results));
        $this->assertSame([], $results['balance']);
        $this->assertSame([10, 20, 30], array_column($results['tetris'], 'score'));

        foreach ($results['tetris'] as $row) {
            $this->assertSame('tetris', $row['g']);
            $this->assertSame('2026-11-06', $row['d']);
            $this->assertIsNumeric($row['t']);
            $this->assertIsInt($row['id']);
        }

        // the limit keeps the newest ones, still oldest first
        $this->assertSame([20, 30], array_column($service->recentResults($user, ['tetris'], 2)['tetris'], 'score'));
    }

    public function test_an_exercise_page_gets_its_previous_results(): void
    {
        $this->signIn();
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 10]]);
        $this->postJson('/api/results', ['exercise' => 'balance', 'data' => ['v' => 0.4]]);

        $this->get('/exercitii/tetris')->assertInertia(fn (Assert $page) => $page
            ->has('results.tetris', 1)
            ->where('results.tetris.0.score', 10)
            ->where('results.tetris.0.g', 'tetris')
            ->has('results.balance', 1)
            ->where('results.balance.0.v', 0.4));
    }

    public function test_results_of_another_user_are_not_shown(): void
    {
        $this->signIn();
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 10]]);

        $this->signIn();
        $this->get('/exercitii/tetris')->assertInertia(fn (Assert $page) => $page->has('results.tetris', 0));
    }

    /* ---------- journal ---------- */

    public function test_the_journal_keeps_one_entry_per_day(): void
    {
        $user = $this->signIn();

        $this->from('/')->put('/jurnal', ['patch_minutes' => 60, 'eye_comfort' => 4, 'note' => 'bine'])
            ->assertRedirect('/')
            ->assertSessionHasNoErrors();
        $this->put('/jurnal', ['patch_minutes' => 90]);
        $this->put('/jurnal', ['date' => '2026-11-01', 'patch_minutes' => 30]);

        $this->assertSame(2, JournalEntry::query()->where('user_id', $user->id)->count());
        $today = JournalEntry::query()->where('date', '2026-11-06')->firstOrFail();
        $this->assertSame(90, $today->patch_minutes);
        $this->assertNull($today->note);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('journal.patch_minutes', 90));
    }

    public function test_the_journal_is_validated(): void
    {
        $this->signIn();

        $this->from('/')->put('/jurnal', ['date' => '2026-11-07', 'patch_minutes' => 2000, 'eye_comfort' => 9])
            ->assertSessionHasErrors(['date', 'patch_minutes', 'eye_comfort']);

        $this->assertSame(0, JournalEntry::query()->count());
    }

    public function test_exercise_summaries(): void
    {
        $user = $this->signIn();
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 10]]);
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 40]]);
        $this->postJson('/api/results', ['exercise' => 'tetris', 'data' => ['score' => 25]]);
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 120]);
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 100]);

        $summary = app(ProgressService::class)->exerciseSummaries($user)['tetris'];

        $this->assertSame(3, $summary['count']);
        $this->assertSame(40, $summary['best']);
        $this->assertSame(25, $summary['last']['score']);
        $this->assertSame(3, $summary['minutes']);
    }
}
