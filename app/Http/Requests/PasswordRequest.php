<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class PasswordRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'current_password.current_password' => 'Parola actuală nu este corectă.',
            'password.confirmed' => 'Cele două parole noi nu sunt la fel.',
            'password.min' => 'Parola nouă trebuie să aibă cel puțin 8 caractere.',
        ];
    }
}
