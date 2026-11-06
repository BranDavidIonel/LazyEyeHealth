<?php

namespace App\Http\Controllers;

use App\Http\Requests\PasswordRequest;
use App\Http\Requests\SettingsRequest;
use App\Services\SettingsService;
use App\Support\AuthMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Settings page (lazy eye, glasses, goal, breaks) and the password of the account. */
class SettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/Edit', [
            'canChangePassword' => AuthMode::loginRequired(),
        ]);
    }

    /**
     * Saves changed settings. The exercise pages call it with fetch (JSON answer);
     * the settings page with an Inertia visit (redirect back).
     */
    public function update(SettingsRequest $request, SettingsService $settings): JsonResponse|RedirectResponse
    {
        $data = $settings->update($request->user(), $request->validated());

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['settings' => $data]);
        }

        return back()->with('success', 'Setările au fost salvate.');
    }

    public function updatePassword(PasswordRequest $request): RedirectResponse
    {
        $request->user()->update(['password' => $request->string('password')->toString()]);

        return back()->with('success', 'Parola a fost schimbată.');
    }

    /** The current settings as JSON (used after a calibration in another tab). */
    public function show(Request $request, SettingsService $settings): JsonResponse
    {
        return response()->json(['settings' => $settings->for($request->user())]);
    }
}
