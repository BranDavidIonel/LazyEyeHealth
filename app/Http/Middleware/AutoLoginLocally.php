<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AuthMode;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Local mode without login (AUTH_ENABLED=false, APP_ENV=local): signs the
 * visitor in as the admin user from config/eye.php, creating it on first use.
 */
class AutoLoginLocally
{
    public function handle(Request $request, Closure $next): Response
    {
        if (AuthMode::bypass() && ! Auth::check()) {
            $admin = config('eye.admin');

            $user = User::query()->firstOrCreate(
                ['email' => $admin['email']],
                [
                    'name' => $admin['name'],
                    'password' => $admin['password'] ?: Str::random(32),
                ],
            );

            Auth::login($user, remember: true);
        }

        return $next($request);
    }
}
