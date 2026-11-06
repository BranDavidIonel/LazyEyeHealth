<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\Rule;

/** Language switcher (top right): Romanian or English. */
class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(['locale' => ['required', Rule::in(SetLocale::LOCALES)]]);

        $request->session()->put('locale', $data['locale']);
        Cookie::queue(SetLocale::COOKIE, $data['locale'], 60 * 24 * 365);

        return back();
    }
}
