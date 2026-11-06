<?php

namespace App\Http\Controllers;

use App\Http\Requests\PracticeRequest;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;

/**
 * Practice time. While the user plays, the exercise page sends the seconds
 * every 15 s (and when the page is closed); they are added to today's row.
 */
class PracticeController extends Controller
{
    public function store(PracticeRequest $request, ProgressService $progress): JsonResponse
    {
        $today = $progress->addSeconds(
            $request->user(),
            $request->string('exercise')->toString(),
            $request->integer('seconds'),
        );

        return response()->json(['today_seconds' => $today]);
    }
}
