<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Support\AuthMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/** Login / logout. Not used locally when AUTH_ENABLED=false (see AutoLoginLocally). */
class LoginController extends Controller
{
    public function create(): Response|RedirectResponse
    {
        if (AuthMode::bypass()) {
            return redirect()->route('home');
        }

        return Inertia::render('auth/Login', [
            'canRegister' => (bool) config('eye.registration_enabled'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended(route('home'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route(AuthMode::bypass() ? 'home' : 'login');
    }
}
