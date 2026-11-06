<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExerciseResultRequest;
use App\Models\ExerciseResult;
use Illuminate\Http\JsonResponse;

/** Saves the result of a finished round or game (sent by the exercise page). */
class ExerciseResultController extends Controller
{
    public function store(ExerciseResultRequest $request): JsonResponse
    {
        $result = ExerciseResult::query()->create([
            'user_id' => $request->user()->id,
            'exercise' => $request->string('exercise')->toString(),
            'date' => today()->toDateString(),
            'data' => $request->cleanData(),
        ]);

        return response()->json(['result' => $result->toClient()], 201);
    }
}
