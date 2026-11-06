<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/** New account from the login page; only when REGISTRATION_ENABLED=true. */
class RegisterController extends Controller
{
    public function create(): Response
    {
        abort_unless(config('eye.registration_enabled'), 404);

        return Inertia::render('auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(config('eye.registration_enabled'), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::query()->create($data);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('home');
    }
}
