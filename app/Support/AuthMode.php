<?php

namespace App\Support;

/**
 * Login on / off. The login page is skipped only when AUTH_ENABLED=false
 * AND the app runs locally (APP_ENV=local), so a wrong .env on the live
 * server never opens the app to everyone.
 */
class AuthMode
{
    public static function loginRequired(): bool
    {
        return config('eye.auth_enabled') || ! app()->environment('local');
    }

    public static function bypass(): bool
    {
        return ! self::loginRequired();
    }
}
