<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Language of the interface: the one the user picked (kept in the session
 * and in a one-year cookie, so it survives a logout), Romanian by default.
 */
class SetLocale
{
    public const LOCALES = ['ro', 'en'];

    public const COOKIE = 'lazyeye_locale';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->session()->get('locale', $request->cookie(self::COOKIE));

        app()->setLocale(in_array($locale, self::LOCALES, true) ? $locale : config('app.locale'));

        return $next($request);
    }
}
