<?php

namespace App\Http\Controllers;

use App\Http\Requests\JournalRequest;
use App\Models\JournalEntry;
use Illuminate\Http\RedirectResponse;

/** Daily journal: patching minutes outside the app, eye comfort and a note (one entry per day). */
class JournalController extends Controller
{
    public function update(JournalRequest $request): RedirectResponse
    {
        JournalEntry::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'date' => $request->string('date')->toString() ?: today()->toDateString()],
            [
                'patch_minutes' => $request->integer('patch_minutes'),
                'eye_comfort' => $request->input('eye_comfort'),
                'note' => $request->input('note'),
            ],
        );

        return back()->with('success', __('Journal for the day saved.'));
    }
}
