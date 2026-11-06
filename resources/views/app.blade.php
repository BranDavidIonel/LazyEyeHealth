<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="{{ $page['props']['settings']['theme'] ?? 'light' }}">
    <head>
        <meta charset="utf-8">
        {{-- Before login there are no settings: use the theme kept in the browser. --}}
        @if (! isset($page['props']['settings']['theme']))
            <script>try { var t = localStorage.getItem('lazyeye.theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}</script>
        @endif
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @vite(['resources/css/app.css', 'resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
