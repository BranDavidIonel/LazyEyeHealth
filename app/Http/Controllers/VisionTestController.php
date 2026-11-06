<?php

namespace App\Http\Controllers;

use App\Enums\Eye;
use App\Enums\VisionTestType;
use App\Http\Requests\VisionTestRequest;
use App\Models\VisionTest;
use App\Services\VisionProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Vision checks: letter chart, reading and contrast tests, the history and
 * the comparison "now vs. one month ago".
 */
class VisionTestController extends Controller
{
    public function index(Request $request, VisionProgressService $progress): Response
    {
        $user = $request->user();

        return Inertia::render('vision/Index', [
            'comparisons' => $progress->comparisons($user),
            'series' => $progress->series($user),
            'tests' => VisionTest::query()
                ->where('user_id', $user->id)
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->limit(300)
                ->get()
                ->map(fn (VisionTest $t) => $t->toClient())
                ->all(),
            'types' => collect(VisionTestType::cases())->map(fn (VisionTestType $t) => ['value' => $t->value, 'label' => $t->label()])->all(),
            'eyes' => collect(Eye::cases())->map(fn (Eye $e) => ['value' => $e->value, 'label' => $e->label()])->all(),
        ]);
    }

    public function create(Request $request, VisionProgressService $progress, string $type): Response
    {
        $testType = VisionTestType::tryFrom($type);
        abort_if($testType === null, 404);

        $series = $progress->series($request->user())[$testType->value] ?? [];

        return Inertia::render($testType->page(), [
            'type' => $testType->value,
            // Last day average per eye, to start the chart near the user's level and compare at the end.
            'previous' => collect($series)->map(fn (array $days) => end($days) ?: null)->all(),
        ]);
    }

    /** Saves a finished test (sent with fetch) and returns the comparison with the previous ones. */
    public function store(VisionTestRequest $request, VisionProgressService $progress): JsonResponse
    {
        $test = VisionTest::query()->create([
            ...$request->safe()->only(['type', 'eye', 'distance_cm', 'score', 'data', 'note']),
            'user_id' => $request->user()->id,
            'date' => today()->toDateString(),
        ]);

        $series = $progress->series($request->user())[$test->type->value][$test->eye->value] ?? [];

        return response()->json([
            'test' => $test->toClient(),
            'comparison' => $series ? $progress->compare($test->type, $test->eye, $series) : null,
        ], 201);
    }

    public function update(Request $request, VisionTest $visionTest): RedirectResponse
    {
        abort_unless($visionTest->user_id === $request->user()->id, 403);

        $visionTest->update($request->validate(['note' => ['nullable', 'string', 'max:1000']]));

        return back()->with('success', 'Nota a fost salvată.');
    }

    public function destroy(Request $request, VisionTest $visionTest): RedirectResponse
    {
        abort_unless($visionTest->user_id === $request->user()->id, 403);

        $visionTest->delete();

        return back()->with('success', 'Testul a fost șters.');
    }
}
