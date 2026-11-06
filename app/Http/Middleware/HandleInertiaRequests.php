<?php

namespace App\Http\Middleware;

use App\Services\ProgressService;
use App\Services\SettingsService;
use App\Support\AuthMode;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Props every page gets: the user, the exercise settings, today's practice time, messages.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? $user->only(['id', 'name', 'email']) : null,
                // false locally with AUTH_ENABLED=false: no logout button, no password change.
                'loginRequired' => AuthMode::loginRequired(),
            ],
            'settings' => fn () => $user ? app(SettingsService::class)->for($user) : null,
            'todaySeconds' => fn () => $user ? app(ProgressService::class)->todaySeconds($user) : 0,
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
