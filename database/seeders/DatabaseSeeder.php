<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Creates (or updates) the admin user from .env: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD.
     */
    public function run(): void
    {
        $admin = config('eye.admin');
        $password = $admin['password'];

        if (! $password) {
            $password = Str::password(16);
            $this->command?->warn("ADMIN_PASSWORD is missing from .env. Generated password for {$admin['email']}: {$password}");
        }

        User::query()->updateOrCreate(
            ['email' => $admin['email']],
            ['name' => $admin['name'], 'password' => $password],
        );
    }
}
