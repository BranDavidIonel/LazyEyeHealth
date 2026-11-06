<?php

namespace App\Support;

/**
 * The list of exercises. One place for the slugs (URLs, practice time,
 * results), titles and the Vue page that runs each exercise.
 *
 * group: 'dichoptic' = both eyes with red-cyan glasses (each eye sees other pieces)
 *        'stereo'    = both eyes with red-cyan glasses (depth / relief)
 *        'mono'      = only the lazy eye (glasses or patch on the good eye)
 *        'setup'     = calibration, not shown in the exercise lists
 */
class ExerciseCatalog
{
    /**
     * @return array<string, array{slug: string, title: string, group: string, page: string, description: string, trains: string, minutes: string}>
     */
    public static function all(): array
    {
        $items = [
            [
                'slug' => 'tetris',
                'title' => 'Tetris dihoptic',
                'group' => 'dichoptic',
                'page' => 'exercises/Tetris',
                'description' => 'Piesa care cade o vede ochiul leneș, piesele așezate le vede ochiul bun.',
                'trains' => 'Colaborarea ochilor, reducerea suprimării',
                'minutes' => '15–20 min',
            ],
            [
                'slug' => 'breakout',
                'title' => 'Breakout dihoptic',
                'group' => 'dichoptic',
                'page' => 'exercises/Breakout',
                'description' => 'Mingea și cărămizile le vede ochiul leneș, paleta o vede ochiul bun.',
                'trains' => 'Colaborarea ochilor, coordonarea ochi-mână',
                'minutes' => '15–20 min',
            ],
            [
                'slug' => 'sarpe',
                'title' => 'Șarpele dihoptic',
                'group' => 'dichoptic',
                'page' => 'exercises/Snake',
                'description' => 'Șarpele îl vede ochiul leneș, mâncarea și obstacolele le vede ochiul bun.',
                'trains' => 'Colaborarea ochilor, atenția vizuală',
                'minutes' => '10–15 min',
            ],
            [
                'slug' => 'relief',
                'title' => 'Relief 3D',
                'group' => 'stereo',
                'page' => 'exercises/Stereo',
                'description' => 'Puncte aleatorii în care se ascunde o formă în relief. Spui ce formă vezi.',
                'trains' => 'Vederea în relief (stereopsis), fuziunea',
                'minutes' => '10 min',
            ],
            [
                'slug' => 'contrast',
                'title' => 'Contrast fin',
                'group' => 'mono',
                'page' => 'exercises/Contrast',
                'description' => 'Dungi tot mai șterse: spui încotro sunt înclinate.',
                'trains' => 'Sensibilitatea la contrast',
                'minutes' => '10 min',
            ],
            [
                'slug' => 'litera-e',
                'title' => 'Litera E',
                'group' => 'mono',
                'page' => 'exercises/LetterE',
                'description' => 'Încotro arată litera E? Tot mai mică, cu sau fără litere vecine.',
                'trains' => 'Acuitatea vizuală, aglomerarea (crowding)',
                'minutes' => '10 min',
            ],
            [
                'slug' => 'vernier',
                'title' => 'Linii aliniate',
                'group' => 'mono',
                'page' => 'exercises/Vernier',
                'description' => 'Două linii aproape aliniate: încotro e mutată cea de jos?',
                'trains' => 'Hiperacuitatea (precizia poziției)',
                'minutes' => '5–10 min',
            ],
            [
                'slug' => 'inel',
                'title' => 'Inelul deschis',
                'group' => 'mono',
                'page' => 'exercises/Ring',
                'description' => 'Găsește inelul care are o deschizătură, contra cronometru.',
                'trains' => 'Acuitatea, căutarea vizuală, mișcările ochiului',
                'minutes' => '5–10 min',
            ],
            [
                'slug' => 'citire',
                'title' => 'Citire cu ochiul leneș',
                'group' => 'mono',
                'page' => 'exercises/Reading',
                'description' => 'Texte scurte, tot mai mici, citite doar cu ochiul leneș.',
                'trains' => 'Citirea, aglomerarea, rezistența la efort',
                'minutes' => '10–15 min',
            ],
            [
                'slug' => 'calibrare',
                'title' => 'Calibrare',
                'group' => 'setup',
                'page' => 'exercises/Calibration',
                'description' => 'Ochelarii, testul de fuziune Worth, echilibrul dintre ochi și mărimea ecranului.',
                'trains' => 'Pregătire',
                'minutes' => '5 min',
            ],
        ];

        return collect($items)->keyBy('slug')->all();
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

    /** Keys that may log practice time: every exercise, the calibration and the vision tests. */
    public static function practiceKeys(): array
    {
        return [...array_keys(self::all()), 'test-vedere'];
    }

    /** Keys that may store results: every exercise plus the extra series the exercises write. */
    public static function resultKeys(): array
    {
        return [...array_keys(self::all()), 'balance', 'worth'];
    }

    /** Extra result series an exercise page needs besides its own. */
    public static function extraResultKeys(string $slug): array
    {
        return match ($slug) {
            'calibrare' => ['worth', 'balance'],
            'tetris', 'breakout', 'sarpe' => ['balance'],
            default => [],
        };
    }

    public static function title(string $key): string
    {
        return match ($key) {
            'test-vedere' => 'Test de vedere',
            'balance' => 'Echilibru ochi',
            'worth' => 'Test Worth',
            default => self::all()[$key]['title'] ?? $key,
        };
    }
}
