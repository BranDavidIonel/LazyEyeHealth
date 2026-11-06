<?php

namespace App\Http\Controllers;

use App\Services\ProgressService;
use App\Support\ExerciseCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Opens an exercise page with its previous results (for "better than last time" and the charts). */
class ExerciseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('exercises/Index', [
            'exercises' => ExerciseCatalog::exercises(),
        ]);
    }

    public function show(Request $request, ProgressService $progress, string $slug): Response
    {
        $exercise = ExerciseCatalog::find($slug);
        abort_if($exercise === null, 404);

        $keys = [$slug, ...ExerciseCatalog::extraResultKeys($slug)];

        return Inertia::render($exercise['page'], [
            'exercise' => $exercise,
            'results' => $progress->recentResults($request->user(), $keys),
        ]);
    }

    public function calibration(Request $request, ProgressService $progress): Response
    {
        return $this->show($request, $progress, 'calibrare');
    }
}
