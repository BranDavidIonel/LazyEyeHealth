<?php

namespace App\Http\Requests;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }

    /**
     * Checks the email and password. After 5 wrong tries the email + IP waits a minute.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $key = Str::transliterate(Str::lower($this->string('email')->toString()).'|'.$this->ip());

        if (RateLimiter::tooManyAttempts($key, 5)) {
            event(new Lockout($this));

            throw ValidationException::withMessages([
                'email' => trans_choice('Too many attempts. Try again in :seconds seconds.', RateLimiter::availableIn($key), ['seconds' => RateLimiter::availableIn($key)]),
            ]);
        }

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($key);

            throw ValidationException::withMessages([
                'email' => __('The email or the password is not correct.'),
            ]);
        }

        RateLimiter::clear($key);
    }
}
