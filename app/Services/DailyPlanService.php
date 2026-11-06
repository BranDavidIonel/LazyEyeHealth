<?php

namespace App\Services;

use App\Enums\VisionTestType;
use App\Models\PracticeLog;
use App\Models\User;
use App\Models\VisionTest;
use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;

/**
 * "Today's program" on the home page: one game with both eyes, one precision
 * exercise for the lazy eye (they change every day), the relief exercise
 * every second day and reminders for the calibration and the weekly test.
 */
class DailyPlanService
{
    private const DICHOPTIC = ['tetris', 'breakout', 'sarpe'];

    private const MONO = ['contrast', 'litera-e', 'citire', 'vernier', 'inel'];

    public function __construct(private SettingsService $settings) {}

    /** @return list<array{kind: string, slug: string|null, title: string, text: string, minutes: string, done: bool, url: string}> */
    public function today(User $user): array
    {
        $today = CarbonImmutable::today();
        $dayNumber = (int) $today->dayOfYear;
        $settings = $this->settings->for($user);

        $practiced = PracticeLog::query()
            ->where('user_id', $user->id)
            ->where('date', $today->toDateString())
            ->pluck('seconds', 'exercise');

        $done = fn (string $slug) => ($practiced[$slug] ?? 0) >= 5 * 60;
        $plan = [];

        if (! $settings['calibrated']) {
            $plan[] = [
                'kind' => 'setup',
                'slug' => 'calibrare',
                'title' => __('Calibration'),
                'text' => __('Once, at the start: the glasses, the fusion test, the balance between the eyes and the screen size.'),
                'minutes' => '5 min',
                'done' => false,
                'url' => '/calibrare',
            ];
        }

        $game = ExerciseCatalog::find(self::DICHOPTIC[$dayNumber % count(self::DICHOPTIC)]);
        $plan[] = $this->step('dichoptic', $game, __('A game with both eyes, with the red-cyan glasses.'), '15–20 min', $done($game['slug']));

        $mono = ExerciseCatalog::find(self::MONO[$dayNumber % count(self::MONO)]);
        $plan[] = $this->step('mono', $mono, __('A precision exercise for the lazy eye only.'), '10 min', $done($mono['slug']));

        // Relief and convergence take turns (both need the glasses and tire the eyes).
        if ($dayNumber % 2 === 0) {
            $stereo = ExerciseCatalog::find('relief');
            $plan[] = $this->step('stereo', $stereo, __('Training for depth vision.'), '5–10 min', $done('relief'));
        } else {
            $vergence = ExerciseCatalog::find('convergenta');
            $plan[] = $this->step('vergence', $vergence, __('The eyes learn to stay together (divergent strabismus).'), '5–10 min', $done('convergenta'));
        }

        $lastAcuity = VisionTest::query()
            ->where('user_id', $user->id)
            ->where('type', VisionTestType::Acuity->value)
            ->max('date');

        $daysSince = $lastAcuity ? (int) CarbonImmutable::parse(substr((string) $lastAcuity, 0, 10))->diffInDays($today) : null;

        if ($daysSince === null || $daysSince >= 7) {
            $plan[] = [
                'kind' => 'test',
                'slug' => null,
                'title' => __('The weekly vision test'),
                'text' => $daysSince === null
                    ? __('Take the first letter chart test: it is the starting point for comparisons.')
                    : trans_choice('The last letter chart test was :days days ago.', $daysSince, ['days' => $daysSince]),
                'minutes' => '5 min',
                'done' => false,
                'url' => '/test-vedere/acuity',
            ];
        }

        return $plan;
    }

    /**
     * @param  array{slug: string, title: string}  $exercise
     * @return array{kind: string, slug: string, title: string, text: string, minutes: string, done: bool, url: string}
     */
    private function step(string $kind, array $exercise, string $text, string $minutes, bool $done): array
    {
        return [
            'kind' => $kind,
            'slug' => $exercise['slug'],
            'title' => $exercise['title'],
            'text' => $text,
            'minutes' => $minutes,
            'done' => $done,
            'url' => '/exercitii/'.$exercise['slug'],
        ];
    }
}
