<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\ExerciseResultController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\VisionTestController;
use Illuminate\Support\Facades\Route;

// Login (skipped locally when AUTH_ENABLED=false, see App\Support\AuthMode).
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:20,1')->name('login.store');
    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:5,1')->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // Home: today's program, time, streak, exercises, vision progress.
    Route::get('/', DashboardController::class)->name('home');

    // Exercises (each one is a Vue page that runs the game in a canvas).
    Route::get('exercitii', [ExerciseController::class, 'index'])->name('exercises.index');
    Route::get('exercitii/{slug}', [ExerciseController::class, 'show'])->name('exercises.show');
    Route::get('calibrare', [ExerciseController::class, 'calibration'])->name('calibration');

    // Vision checks and the monthly comparison.
    Route::get('test-vedere', [VisionTestController::class, 'index'])->name('vision.index');
    Route::get('test-vedere/{type}', [VisionTestController::class, 'create'])->name('vision.create');
    Route::patch('test-vedere/{visionTest}', [VisionTestController::class, 'update'])->name('vision.update');
    Route::delete('test-vedere/{visionTest}', [VisionTestController::class, 'destroy'])->name('vision.destroy');

    // Reports.
    Route::get('rapoarte', [ReportController::class, 'index'])->name('reports.index');
    Route::get('rapoarte/export', [ReportController::class, 'export'])->name('reports.export');

    // Settings, account, journal, guide.
    Route::get('setari', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::put('setari', [SettingsController::class, 'update'])->name('settings.update');
    Route::put('setari/parola', [SettingsController::class, 'updatePassword'])->middleware('throttle:6,1')->name('settings.password');
    Route::put('jurnal', [JournalController::class, 'update'])->name('journal.update');
    Route::inertia('ghid', 'Guide')->name('guide');

    // JSON calls made by the exercise pages while you play (fetch, same session + CSRF).
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
        Route::put('settings', [SettingsController::class, 'update'])->middleware('throttle:120,1')->name('settings.update');
        Route::post('practice', [PracticeController::class, 'store'])->middleware('throttle:60,1')->name('practice.store');
        Route::post('results', [ExerciseResultController::class, 'store'])->middleware('throttle:60,1')->name('results.store');
        Route::post('vision-tests', [VisionTestController::class, 'store'])->middleware('throttle:30,1')->name('vision.store');
    });
});
