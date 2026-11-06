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
                'title' => 'Calibrarea',
                'text' => 'O singură dată, la început: ochelarii, testul de fuziune, echilibrul dintre ochi și mărimea ecranului.',
                'minutes' => '5 min',
                'done' => false,
                'url' => '/calibrare',
            ];
        }

        $game = ExerciseCatalog::find(self::DICHOPTIC[$dayNumber % count(self::DICHOPTIC)]);
        $plan[] = $this->step('dichoptic', $game, 'Joc cu ambii ochi, cu ochelarii roșu-cyan.', '15–20 min', $done($game['slug']));

        $mono = ExerciseCatalog::find(self::MONO[$dayNumber % count(self::MONO)]);
        $plan[] = $this->step('mono', $mono, 'Exercițiu de precizie doar pentru ochiul leneș.', '10 min', $done($mono['slug']));

        if ($dayNumber % 2 === 0) {
            $stereo = ExerciseCatalog::find('relief');
            $plan[] = $this->step('stereo', $stereo, 'Antrenament pentru vederea în relief.', '5–10 min', $done('relief'));
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
                'title' => 'Testul săptămânal de vedere',
                'text' => $daysSince === null
                    ? 'Fă primul test cu tabelul de litere: el e punctul de plecare pentru comparații.'
                    : "Ultimul test cu tabelul de litere a fost acum {$daysSince} zile.",
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
