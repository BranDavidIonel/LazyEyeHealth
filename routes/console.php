<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

/*
 * Creates a user or changes the password of an existing one (for the live server):
 *   php artisan app:user ana@example.com --name="Ana"
 * The password is asked for (hidden), or given with --password=...
 */
Artisan::command('app:user {email} {--name=} {--password=}', function (string $email) {
    $password = $this->option('password') ?: $this->secret('Parola (minim 8 caractere)');

    $validator = Validator::make(
        ['email' => $email, 'password' => $password],
        ['email' => ['required', 'email'], 'password' => ['required', 'min:8']],
    );

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $user = User::query()->firstOrNew(['email' => $email]);
    $user->name = $this->option('name') ?: ($user->name ?: strstr($email, '@', true));
    $user->password = $password;
    $isNew = ! $user->exists;
    $user->save();

    $this->info($isNew ? "Utilizator creat: {$email}" : "Parolă schimbată pentru: {$email}");

    return 0;
})->purpose('Creează un utilizator sau îi schimbă parola');
