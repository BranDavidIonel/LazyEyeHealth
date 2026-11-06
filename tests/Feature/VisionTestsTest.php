<?php

namespace Tests\Feature;

use App\Enums\Eye;
use App\Enums\VisionTestType;
use App\Models\User;
use App\Models\VisionTest;
use App\Services\VisionProgressService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class VisionTestsTest extends TestCase
{
    use RefreshDatabase;

    private const TODAY = '2026-11-06';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse(self::TODAY.' 12:00:00'));
    }

    private function service(): VisionProgressService
    {
        return app(VisionProgressService::class);
    }

    /** A saved test, $daysAgo days before today. */
    private function makeTest(User $user, int $daysAgo, float $score, string $type = 'acuity', string $eye = 'right', array $data = []): VisionTest
    {
        return VisionTest::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'eye' => $eye,
            'date' => CarbonImmutable::parse(self::TODAY)->subDays($daysAgo)->toDateString(),
            'distance_cm' => 150,
            'score' => $score,
            'data' => $data ?: ['letters_correct' => 30],
        ]);
    }

    /** One day of a series, as VisionProgressService::series() builds it. */
    private function day(int $daysAgo, float $score, array $extra = []): array
    {
        return [
            'date' => CarbonImmutable::parse(self::TODAY)->subDays($daysAgo)->toDateString(),
            'score' => $score,
            'count' => 1,
            'extra' => [...['max_wpm' => null, 'cps' => null, 'letters' => null], ...$extra],
        ];
    }

    /* ---------- saving ---------- */

    public function test_a_test_is_stored_with_all_its_details(): void
    {
        $user = $this->signIn();
        $data = [
            'letters_correct' => 42,
            'lines' => [
                ['logmar' => 0.3, 'shown' => 'CDHKN', 'typed' => 'CDHKN', 'correct' => 5],
                ['logmar' => 0.2, 'shown' => 'ORSVZ', 'typed' => 'ORSV', 'correct' => 4],
            ],
            'top' => 0.3,
            'floor' => false,
            'ceiling' => false,
            'px_per_mm' => 3.78,
            'nested' => ['a' => ['b' => ['c' => 1]]],
        ];

        $response = $this->postJson('/api/vision-tests', [
            'type' => 'acuity',
            'eye' => 'right',
            'distance_cm' => 150,
            'score' => 0.22,
            'data' => $data,
        ]);

        $response->assertCreated()
            ->assertJsonPath('test.type', 'acuity')
            ->assertJsonPath('test.eye', 'right')
            ->assertJsonPath('test.date', self::TODAY)
            ->assertJsonPath('test.score', 0.22)
            ->assertJsonPath('test.data.letters_correct', 42)
            ->assertJsonPath('test.data.nested.a.b.c', 1)
            ->assertJsonPath('comparison.type', 'acuity')
            ->assertJsonPath('comparison.eye', 'right')
            ->assertJsonPath('comparison.tests', 1)
            ->assertJsonPath('comparison.month', null)
            ->assertJsonPath('comparison.since_start', null)
            ->assertJsonPath('comparison.latest.extra.letters', 42);

        $test = VisionTest::query()->firstOrFail();
        $this->assertSame($user->id, $test->user_id);
        $this->assertSame(VisionTestType::Acuity, $test->type);
        $this->assertSame(Eye::Right, $test->eye);
        $this->assertSame(150, $test->distance_cm);
        // regression: every key of "data" is kept, not only the ones with a rule
        $this->assertSame($data, $test->data);
    }

    public function test_a_contrast_test_keeps_its_triplets(): void
    {
        $this->signIn();
        $triplets = [
            ['logcs' => 0, 'shown' => 'CDH', 'typed' => 'CDH', 'correct' => 3],
            ['logcs' => 0.15, 'shown' => 'KNO', 'typed' => 'KN', 'correct' => 2],
            ['logcs' => 0.3, 'shown' => 'RSV', 'typed' => '', 'correct' => 0],
        ];

        $this->postJson('/api/vision-tests', [
            'type' => 'contrast',
            'eye' => 'left',
            'distance_cm' => 100,
            'score' => 0.1,
            'data' => ['letters_correct' => 5, 'triplets' => $triplets, 'last_full_triplet' => 0.15],
        ])->assertCreated();

        $test = VisionTest::query()->firstOrFail();
        // Laravel's ConvertEmptyStringsToNull middleware turns the empty answer into null
        $triplets[2]['typed'] = null;
        $this->assertSame($triplets, $test->data['triplets']);
        $this->assertSame(0.15, $test->data['last_full_triplet']);
    }

    /** @return array<string, array{array<string, mixed>, string}> */
    public static function invalidTests(): array
    {
        $ok = ['type' => 'acuity', 'eye' => 'right', 'distance_cm' => 150, 'score' => 0.2, 'data' => ['letters_correct' => 40]];

        return [
            'unknown type' => [[...$ok, 'type' => 'colour'], 'type'],
            'unknown eye' => [[...$ok, 'eye' => 'third'], 'eye'],
            'score too high' => [[...$ok, 'score' => 2.6], 'score'],
            'score too low' => [[...$ok, 'score' => -0.6], 'score'],
            'distance too short' => [[...$ok, 'distance_cm' => 10], 'distance_cm'],
            'no data' => [array_diff_key($ok, ['data' => 1]), 'data'],
            'data too large' => [[...$ok, 'data' => ['blob' => str_repeat('x', 20001)]], 'data'],
            'note too long' => [[...$ok, 'note' => str_repeat('n', 1001)], 'note'],
        ];
    }

    #[DataProvider('invalidTests')]
    public function test_invalid_tests_are_rejected(array $payload, string $field): void
    {
        $this->signIn();

        $this->postJson('/api/vision-tests', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);

        $this->assertSame(0, VisionTest::query()->count());
    }

    public function test_saving_returns_the_comparison_with_a_month_ago(): void
    {
        $user = $this->signIn();
        $this->makeTest($user, 30, 0.5);

        $this->postJson('/api/vision-tests', [
            'type' => 'acuity', 'eye' => 'right', 'distance_cm' => 150, 'score' => 0.3, 'data' => ['letters_correct' => 45],
        ])
            ->assertCreated()
            ->assertJsonPath('comparison.tests', 2)
            ->assertJsonPath('comparison.baseline.gap', 30)
            ->assertJsonPath('comparison.approximate', false)
            ->assertJsonPath('comparison.month.gain', 0.2)
            ->assertJsonPath('comparison.month.lines', 2)
            ->assertJsonPath('comparison.month.letters', 10)
            ->assertJsonPath('comparison.month.verdict', 'better')
            ->assertJsonPath('comparison.since_start.verdict', 'better');
    }

    public function test_the_comparison_only_uses_the_same_eye_and_type(): void
    {
        $user = $this->signIn();
        $this->makeTest($user, 30, 0.9, 'acuity', 'left');
        $this->makeTest($user, 30, 1.2, 'contrast', 'right');

        $this->postJson('/api/vision-tests', [
            'type' => 'acuity', 'eye' => 'right', 'distance_cm' => 150, 'score' => 0.3, 'data' => ['letters_correct' => 45],
        ])->assertJsonPath('comparison.tests', 1)->assertJsonPath('comparison.month', null);
    }

    /* ---------- note and delete ---------- */

    public function test_the_owner_can_add_a_note(): void
    {
        $user = $this->signIn();
        $test = $this->makeTest($user, 0, 0.3);

        $this->from('/test-vedere')
            ->patch("/test-vedere/{$test->id}", ['note' => 'ochelari noi'])
            ->assertRedirect('/test-vedere')
            ->assertSessionHas('success', 'Nota a fost salvată.');

        $this->assertSame('ochelari noi', $test->fresh()->note);
    }

    public function test_another_user_cannot_change_or_delete_a_test(): void
    {
        $owner = User::factory()->create();
        $test = $this->makeTest($owner, 0, 0.3);
        $this->signIn();

        $this->patch("/test-vedere/{$test->id}", ['note' => 'hacked'])->assertForbidden();
        $this->delete("/test-vedere/{$test->id}")->assertForbidden();

        $this->assertNull($test->fresh()->note);
        $this->assertNotNull($test->fresh());
    }

    public function test_the_owner_can_delete_a_test(): void
    {
        $user = $this->signIn();
        $test = $this->makeTest($user, 0, 0.3);

        $this->from('/test-vedere')
            ->delete("/test-vedere/{$test->id}")
            ->assertRedirect('/test-vedere')
            ->assertSessionHas('success', 'Testul a fost șters.');

        $this->assertNull($test->fresh());
    }

    public function test_an_unknown_test_is_404(): void
    {
        $this->signIn();

        $this->patch('/test-vedere/999', ['note' => 'x'])->assertNotFound();
    }

    /* ---------- pages ---------- */

    public function test_the_overview_lists_the_tests_and_comparisons(): void
    {
        $user = $this->signIn();
        $this->makeTest($user, 30, 0.5);
        $this->makeTest($user, 0, 0.3);
        $this->makeTest(User::factory()->create(), 0, 0.1);

        $this->get('/test-vedere')->assertInertia(fn (Assert $page) => $page
            ->component('vision/Index')
            ->has('tests', 2)
            ->where('tests.0.date', self::TODAY)
            ->has('comparisons', 1)
            ->where('comparisons.0.month.verdict', 'better')
            ->has('series.acuity.right', 2));
    }

    public function test_a_test_page_gets_the_last_day_per_eye(): void
    {
        $user = $this->signIn();
        $this->makeTest($user, 10, 0.5);
        $this->makeTest($user, 2, 0.4);
        $this->makeTest($user, 2, 0.2);

        $this->get('/test-vedere/acuity')->assertInertia(fn (Assert $page) => $page
            ->component('vision/Acuity')
            ->where('previous.right.score', 0.3)
            ->where('previous.right.count', 2)
            ->missing('previous.left'));
    }

    /* ---------- VisionProgressService ---------- */

    public function test_tests_of_the_same_day_are_averaged(): void
    {
        $user = User::factory()->create();
        $this->makeTest($user, 5, 0.4, data: ['letters_correct' => 40, 'max_wpm' => 120]);
        $this->makeTest($user, 5, 0.2, data: ['letters_correct' => 50, 'max_wpm' => 140]);
        $this->makeTest($user, 0, 0.1, data: ['letters_correct' => 55]);
        $this->makeTest($user, 0, 1.6, 'contrast', 'right', ['letters_correct' => 35]);

        $series = $this->service()->series($user);

        $days = $series['acuity']['right'];
        $this->assertCount(2, $days);
        $this->assertSame('2026-11-01', $days[0]['date']);
        $this->assertSame(0.3, $days[0]['score']);
        $this->assertSame(2, $days[0]['count']);
        $this->assertSame(45.0, $days[0]['extra']['letters']);
        $this->assertSame(130.0, $days[0]['extra']['max_wpm']);
        $this->assertNull($days[1]['extra']['max_wpm']);
        $this->assertSame([self::TODAY], array_column($series['contrast']['right'], 'date'));
    }

    public function test_the_baseline_is_the_day_closest_to_30_days_within_20_to_45(): void
    {
        $days = [$this->day(50, 0.8), $this->day(40, 0.7), $this->day(28, 0.6), $this->day(10, 0.5), $this->day(0, 0.4)];

        $c = $this->service()->compare(VisionTestType::Acuity, Eye::Right, $days);

        $this->assertSame(28, $c['baseline']['gap']);
        $this->assertSame(0.6, $c['baseline']['score']);
        $this->assertFalse($c['approximate']);
        $this->assertSame(5, $c['tests']);
        $this->assertSame(0.2, $c['month']['gain']);
        $this->assertSame(0.4, $c['since_start']['gain']);
        $this->assertSame(0.8, $c['first']['score']);
        $this->assertTrue($c['lower_is_better']);
        $this->assertSame(0.1, $c['noise']);
    }

    public function test_the_closest_to_30_wins_on_either_side(): void
    {
        $c = $this->service()->compare(VisionTestType::Acuity, Eye::Right, [$this->day(35, 0.6), $this->day(26, 0.5), $this->day(0, 0.4)]);

        $this->assertSame(26, $c['baseline']['gap']);
    }

    public function test_days_outside_20_to_45_are_not_a_month_baseline(): void
    {
        $c = $this->service()->compare(VisionTestType::Acuity, Eye::Right, [$this->day(46, 0.6), $this->day(19, 0.5), $this->day(0, 0.4)]);

        // falls back to the first day at least a week older (the 46-day one, the oldest)
        $this->assertSame(46, $c['baseline']['gap']);
        $this->assertTrue($c['approximate']);
    }

    public function test_without_a_month_baseline_the_first_test_a_week_older_is_used(): void
    {
        $c = $this->service()->compare(VisionTestType::Acuity, Eye::Right, [$this->day(15, 0.6), $this->day(9, 0.5), $this->day(3, 0.45), $this->day(0, 0.4)]);

        $this->assertSame(15, $c['baseline']['gap']);
        $this->assertTrue($c['approximate']);
        $this->assertSame(0.2, $c['month']['gain']);
    }

    public function test_no_baseline_when_every_test_is_newer_than_a_week(): void
    {
        $c = $this->service()->compare(VisionTestType::Acuity, Eye::Right, [$this->day(6, 0.6), $this->day(0, 0.4)]);

        $this->assertNull($c['baseline']);
        $this->assertNull($c['month']);
        $this->assertFalse($c['approximate']);
        $this->assertSame(0.2, $c['since_start']['gain']);
    }

    public function test_a_single_test_has_nothing_to_compare(): void
    {
        $c = $this->service()->compare(VisionTestType::Contrast, Eye::Both, [$this->day(0, 1.5)]);

        $this->assertNull($c['month']);
        $this->assertNull($c['since_start']);
        $this->assertSame(1, $c['tests']);
        $this->assertFalse($c['lower_is_better']);
    }

    /** @return array<string, array{float, float, string, float, int}> */
    public static function acuityVerdicts(): array
    {
        // old, new (logMAR: lower is better), verdict, lines, letters
        return [
            'two lines better' => [0.5, 0.3, 'better', 2.0, 10],
            'three lines better' => [0.6, 0.3, 'better', 3.0, 15],
            'one line better' => [0.5, 0.4, 'maybe_better', 1.0, 5],
            'two letters' => [0.5, 0.46, 'stable', 0.4, 2],
            'same' => [0.4, 0.4, 'stable', 0.0, 0],
            'one line worse' => [0.4, 0.5, 'maybe_worse', -1.0, -5],
            'two lines worse' => [0.3, 0.5, 'worse', -2.0, -10],
        ];
    }

    #[DataProvider('acuityVerdicts')]
    public function test_acuity_verdicts(float $old, float $new, string $verdict, float $lines, int $letters): void
    {
        $d = $this->service()->delta(VisionTestType::Acuity, ['score' => $old], ['score' => $new]);

        $this->assertSame($verdict, $d['verdict']);
        $this->assertSame($lines, $d['lines']);
        $this->assertSame($letters, $d['letters']);
        $this->assertSame(round($old - $new, 3), $d['gain']);
        $this->assertArrayNotHasKey('speed_change_pct', $d);
    }

    /** @return array<string, array{float, float, string, float, int}> */
    public static function contrastVerdicts(): array
    {
        // old, new (logCS: higher is better), verdict, triplets ("lines"), letters
        return [
            'two triplets better' => [1.2, 1.5, 'better', 2.0, 6],
            'one triplet better' => [1.2, 1.35, 'maybe_better', 1.0, 3],
            'one letter' => [1.2, 1.25, 'stable', 0.3, 1],
            'one triplet worse' => [1.2, 1.05, 'maybe_worse', -1.0, -3],
            'two triplets worse' => [1.5, 1.2, 'worse', -2.0, -6],
        ];
    }

    #[DataProvider('contrastVerdicts')]
    public function test_contrast_verdicts(float $old, float $new, string $verdict, float $lines, int $letters): void
    {
        $d = $this->service()->delta(VisionTestType::Contrast, ['score' => $old], ['score' => $new]);

        $this->assertSame($verdict, $d['verdict']);
        $this->assertSame($lines, $d['lines']);
        $this->assertSame($letters, $d['letters']);
        $this->assertSame(round($new - $old, 3), $d['gain']);
    }

    public function test_reading_reports_the_change_of_speed(): void
    {
        $d = $this->service()->delta(
            VisionTestType::Reading,
            ['score' => 0.5, 'extra' => ['max_wpm' => 100.0]],
            ['score' => 0.4, 'extra' => ['max_wpm' => 120.0]],
        );

        $this->assertSame('maybe_better', $d['verdict']);
        $this->assertSame(20, $d['speed_change_pct']);
    }

    public function test_comparisons_are_ordered_by_type_then_eye(): void
    {
        $user = User::factory()->create();
        $this->makeTest($user, 0, 1.5, 'contrast', 'both');
        $this->makeTest($user, 0, 0.1, 'acuity', 'left');
        $this->makeTest($user, 0, 0.3, 'reading', 'right');
        $this->makeTest($user, 0, 0.5, 'acuity', 'right');

        $order = array_map(
            fn (array $c) => $c['type'].'/'.$c['eye'],
            $this->service()->comparisons($user),
        );

        $this->assertSame(['acuity/right', 'acuity/left', 'reading/right', 'contrast/both'], $order);
    }
}
