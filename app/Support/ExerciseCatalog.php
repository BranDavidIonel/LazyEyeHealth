<?php

namespace App\Support;

/**
 * The list of exercises. One place for the slugs (URLs, practice time,
 * results), titles and the Vue page that runs each exercise.
 * Texts are English and translated with __() (Romanian in lang/ro.json).
 *
 * group: 'dichoptic' = both eyes with red-cyan glasses (each eye sees other pieces)
 *        'stereo'    = both eyes with red-cyan glasses (depth / relief)
 *        'mono'      = only the lazy eye (glasses or patch on the good eye)
 *        'vergence'  = strabismus / convergence training (eyes turning together)
 *        'setup'     = calibration, not shown in the exercise lists
 */
class ExerciseCatalog
{
    /** @var list<array{slug: string, title: string, group: string, page: string, description: string, trains: string, minutes: string}> */
    private const ITEMS = [
        [
            'slug' => 'tetris',
            'title' => 'Dichoptic Tetris',
            'group' => 'dichoptic',
            'page' => 'exercises/Tetris',
            'description' => 'The lazy eye sees the falling piece, the good eye sees the pieces already placed.',
            'trains' => 'Eye teamwork, less suppression',
            'minutes' => '15–20 min',
        ],
        [
            'slug' => 'breakout',
            'title' => 'Dichoptic Breakout',
            'group' => 'dichoptic',
            'page' => 'exercises/Breakout',
            'description' => 'The lazy eye sees the ball and the bricks, the good eye sees the paddle.',
            'trains' => 'Eye teamwork, eye-hand coordination',
            'minutes' => '15–20 min',
        ],
        [
            'slug' => 'sarpe',
            'title' => 'Dichoptic Snake',
            'group' => 'dichoptic',
            'page' => 'exercises/Snake',
            'description' => 'The lazy eye sees the snake, the good eye sees the food and the obstacles.',
            'trains' => 'Eye teamwork, visual attention',
            'minutes' => '10–15 min',
        ],
        [
            'slug' => 'relief',
            'title' => '3D relief',
            'group' => 'stereo',
            'page' => 'exercises/Stereo',
            'description' => 'Random dots hide a square that stands out in depth. Say where it is.',
            'trains' => 'Depth vision (stereopsis), fusion',
            'minutes' => '10 min',
        ],
        [
            'slug' => 'contrast',
            'title' => 'Fine contrast',
            'group' => 'mono',
            'page' => 'exercises/Contrast',
            'description' => 'Fainter and fainter stripes: say which way they are tilted.',
            'trains' => 'Contrast sensitivity',
            'minutes' => '10 min',
        ],
        [
            'slug' => 'litera-e',
            'title' => 'Letter E',
            'group' => 'mono',
            'page' => 'exercises/LetterE',
            'description' => 'Which way does the letter E point? Smaller and smaller, with or without neighbouring letters.',
            'trains' => 'Visual acuity, crowding',
            'minutes' => '10 min',
        ],
        [
            'slug' => 'vernier',
            'title' => 'Aligned lines',
            'group' => 'mono',
            'page' => 'exercises/Vernier',
            'description' => 'Two almost aligned lines: which way is the lower one shifted?',
            'trains' => 'Hyperacuity (position precision)',
            'minutes' => '5–10 min',
        ],
        [
            'slug' => 'inel',
            'title' => 'Open ring',
            'group' => 'mono',
            'page' => 'exercises/Ring',
            'description' => 'Find the ring with a gap, against the clock.',
            'trains' => 'Acuity, visual search, eye movements',
            'minutes' => '5–10 min',
        ],
        [
            'slug' => 'citire',
            'title' => 'Reading with the lazy eye',
            'group' => 'mono',
            'page' => 'exercises/Reading',
            'description' => 'Short texts in smaller and smaller print, read with the lazy eye only.',
            'trains' => 'Reading, crowding, stamina',
            'minutes' => '10–15 min',
        ],
        [
            'slug' => 'convergenta',
            'title' => 'Convergence training',
            'group' => 'vergence',
            'page' => 'exercises/Vergence',
            'description' => 'Each eye sees its own picture; keep them as one while they move apart.',
            'trains' => 'Convergence, control of the eye that drifts outward',
            'minutes' => '5–10 min',
        ],
        [
            'slug' => 'fara-ecran',
            'title' => 'Physical exercises (off screen)',
            'group' => 'vergence',
            'page' => 'physical/Index',
            'description' => 'Brock string, pencil push-ups, barrel card, patching: explanations, drawings, timer and measurements.',
            'trains' => 'Near convergence, control of the drifting eye, patching',
            'minutes' => '10–20 min',
        ],
        [
            'slug' => 'calibrare',
            'title' => 'Calibration',
            'group' => 'setup',
            'page' => 'exercises/Calibration',
            'description' => 'The glasses, the Worth fusion test, the balance between the eyes and the screen size.',
            'trains' => 'Setup',
            'minutes' => '5 min',
        ],
    ];

    /**
     * Every exercise, keyed by slug, with the texts in the current language.
     *
     * @return array<string, array{slug: string, title: string, group: string, page: string, description: string, trains: string, minutes: string}>
     */
    public static function all(): array
    {
        $out = [];

        foreach (self::ITEMS as $item) {
            $out[$item['slug']] = [
                ...$item,
                'title' => __($item['title']),
                'description' => __($item['description']),
                'trains' => __($item['trains']),
            ];
        }

        return $out;
    }

    /** Exercises shown in the lists (without the calibration). */
    public static function exercises(): array
    {
        return array_values(array_filter(self::all(), fn (array $e) => $e['group'] !== 'setup'));
    }

    /** @return array{slug: string, title: string, group: string, page: string, description: string, trains: string, minutes: string}|null */
    public static function find(string $slug): ?array
    {
        return self::all()[$slug] ?? null;
    }

    /** @return list<string> */
    public static function slugs(): array
    {
        return array_column(self::ITEMS, 'slug');
    }

    /** Keys that may log practice time: every exercise, the calibration and the vision tests. */
    public static function practiceKeys(): array
    {
        return [...self::slugs(), 'test-vedere'];
    }

    /** Keys that may store results: every exercise plus the extra series the exercises write. */
    public static function resultKeys(): array
    {
        return [...self::slugs(), 'balance', 'worth'];
    }

    /** Extra result series an exercise page needs besides its own. */
    public static function extraResultKeys(string $slug): array
    {
        return match ($slug) {
            'calibrare' => ['worth', 'balance'],
            'convergenta', 'relief' => ['worth'],
            'tetris', 'breakout', 'sarpe' => ['balance'],
            default => [],
        };
    }

    /** Group of a practice key ('test-vedere' counts as 'test'). */
    public static function group(string $key): string
    {
        if ($key === 'test-vedere') {
            return 'test';
        }

        foreach (self::ITEMS as $item) {
            if ($item['slug'] === $key) {
                return $item['group'];
            }
        }

        return 'other';
    }

    public static function title(string $key): string
    {
        return match ($key) {
            'test-vedere' => __('Vision test'),
            'balance' => __('Eye balance'),
            'worth' => __('Worth test'),
            default => self::all()[$key]['title'] ?? $key,
        };
    }
}
