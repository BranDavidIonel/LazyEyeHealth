<?php

/*
|--------------------------------------------------------------------------
| LazyEyeHealth settings
|--------------------------------------------------------------------------
|
| AUTH_ENABLED=false skips the login page, but only when APP_ENV=local:
| every visitor is signed in as the admin user below. On the live server
| (APP_ENV=production) the login page is always required.
|
*/

return [

    'auth_enabled' => (bool) env('AUTH_ENABLED', true),

    // New accounts from the login page. Off by default: users are created with
    // "php artisan app:user" or by the seeder.
    'registration_enabled' => (bool) env('REGISTRATION_ENABLED', false),

    'admin' => [
        'name' => env('ADMIN_NAME', 'Admin'),
        'email' => env('ADMIN_EMAIL', 'admin@example.com'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    // A day counts towards the streak from this many seconds of practice.
    'streak_min_seconds' => 300,

    // Most seconds one practice heartbeat may add (the page sends one every 15 s).
    'heartbeat_max_seconds' => 120,

    // Default settings of a new user (same keys as the exercises use in the browser).
    'default_settings' => [
        'lazyEye' => 'right',      // 'left' | 'right'
        'viewMode' => 'anaglyph',  // 'anaglyph' (red-cyan glasses) | 'patch' (good eye covered)
        'redSide' => 'left',       // eye that wears the red lens
        'otherLens' => 'cyan',     // 'cyan' | 'blue' | 'green'
        'redLevel' => 255,         // brightness of the red channel (lower = less ghosting)
        'otherLevel' => 255,
        'fellowContrast' => 0.3,   // contrast for the good eye in the dichoptic games (0.1 - 1)
        'autoBalance' => true,
        'dailyGoalMin' => 30,
        'breakEveryMin' => 20,
        'sound' => true,
        'pxPerMm' => 3.78,         // CSS px per millimetre (set on the calibration page)
        'distanceCm' => 60,        // usual distance to the screen for the exercises
        'calibrated' => false,
        'sizeCalibrated' => false,
        'theme' => 'light',        // interface colours: 'light' | 'blue' | 'dark'
    ],

];
