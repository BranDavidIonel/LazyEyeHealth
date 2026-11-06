<?php

use App\Http\Middleware\AutoLoginLocally;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The language cookie is plain text (not encrypted), so SetLocale can read it.
        $middleware->encryptCookies(except: [SetLocale::COOKIE]);

        $middleware->web(append: [
            SetLocale::class,
            // Locally with AUTH_ENABLED=false: signs you in as the admin (no login page).
            AutoLoginLocally::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // The local auto-login must run before the "auth" check, otherwise the
        // first request of a new session is sent to /login (and then home).
        $middleware->prependToPriorityList(
            before: AuthenticatesRequests::class,
            prepend: AutoLoginLocally::class,
        );

        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('home'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
