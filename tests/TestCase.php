<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The same conditions whatever the local .env says: login required,
        // no registration, Romanian by default, no Vite build, no SSR server.
        config([
            'app.locale' => 'ro',
            'app.fallback_locale' => 'en',
            'eye.auth_enabled' => true,
            'eye.registration_enabled' => false,
            'inertia.ssr.enabled' => false,
        ]);
        app()->setLocale('ro');
        $this->withoutVite();
    }

    /** A user who is signed in for the next requests. */
    protected function signIn(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $this->actingAs($user);

        return $user;
    }

    /** Local mode without login: APP_ENV=local and AUTH_ENABLED=false (see App\Support\AuthMode). */
    protected function bypassLogin(): void
    {
        $this->app['env'] = 'local';
        config(['eye.auth_enabled' => false]);
        // Outside the "testing" environment Laravel checks the CSRF token again.
        $this->withoutMiddleware(PreventRequestForgery::class);
    }
}
