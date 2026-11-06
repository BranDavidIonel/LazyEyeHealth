# Frontend (Vue)

All browser code is in `resources/js/` and `resources/css/`.

**Tools.** Vue 3 with the **Options API** (`defineComponent({ data, computed, methods })`) and TypeScript. **Inertia v3** connects Vue to Laravel: Laravel picks a page and sends its data (props), Vue draws it — there is no separate REST API for pages (see [backend.md](backend.md)). **Tailwind CSS 4** for the normal pages, ported CSS classes for the exercise pages. **Chart.js** for charts, **Lucide** for icons, Vite (`vite-plus`) to build.

Related pages: [exercises.md](exercises.md) (every exercise), [vision-tests.md](vision-tests.md), [database.md](database.md).

## Folders

```text
resources/
├── css/
│   ├── app.css          Tailwind, theme colours (CSS variables), .panel / .form-* classes
│   └── amb.css          styles of the exercise pages (scoped under .amb)
└── js/
    ├── app.ts           starts Inertia, chooses the layout, i18n, v-focus
    ├── pages/           one Vue file per Inertia page
    ├── layouts/         AppLayout.vue (menu bar)
    ├── components/      charts/ exercise/ general/ layout/ physical/ vision/
    ├── amb/             "Amb": helpers every exercise uses (colours per eye, results, time…)
    ├── exercises/       one module per exercise + runtime.ts
    ├── vision/          helpers of the vision tests (letters, sentences, save)
    ├── i18n/            t(), Romanian dictionaries in i18n/ro/*.ts
    ├── utils/           charts, formats, metrics, menu, themes, stats lines
    ├── lib/             http.ts (JSON calls + offline queue), utils.ts (cn())
    └── types/           shared TypeScript types
```

## Pages

Inertia pages are in `resources/js/pages/`. The **frame** column says what is drawn around the page (next section).

| Page | URL | What it shows | Frame |
|---|---|---|---|
| `Dashboard.vue` | `/` | Today (ring with minutes / goal, run of days), last 14 days chart, today's program, latest vision tests vs. a month ago, the day's journal, all exercises | AppLayout |
| `exercises/Index.vue` | `/exercitii` | Exercise cards grouped by kind | AppLayout |
| `exercises/<Name>.vue` | `/exercitii/{slug}` | One exercise (Tetris, Contrast, …) — see [exercises.md](exercises.md) | ExerciseShell |
| `exercises/Calibration.vue` | `/calibrare` | Calibration: glasses, Worth test, eye balance, screen size | ExerciseShell |
| `physical/Index.vue` | `/exercitii-fizice` | Off-screen exercises: guide, drawings, timers, near point of convergence | AppLayout |
| `vision/Index.vue` | `/test-vedere` | Vision tests: monthly comparison, charts, history, notes | AppLayout |
| `vision/Acuity.vue`, `vision/Reading.vue`, `vision/Contrast.vue` | `/test-vedere/acuity`, `/reading`, `/contrast` | One vision test | TestShell |
| `reports/Index.vue` | `/rapoarte` | Reports for a period: minutes per day / week, calendar, per exercise, measured values over time, CSV export | AppLayout |
| `settings/Edit.vue` | `/setari` | Settings: theme, eyes and glasses, good-eye contrast, daily goal, breaks, sounds, calibration state, password | AppLayout |
| `Guide.vue` | `/ghid` | Guide: program, amblyopia and strabismus, safety, how it works, what the studies say, sources | AppLayout |
| `auth/Login.vue` | `/login` | Login | own (centred card) |
| `auth/Register.vue` | `/register` | New account (only when registration is on) | own (centred card) |

Every page uses `<Head :title="…">` for the browser tab title and gets the **shared props** of `HandleInertiaRequests` in `this.$page.props`: `auth`, `locale`, `settings`, `todaySeconds`, `flash`, `errors`.

## Layouts and frames

`app.ts` decides the layout:

```ts
function hasOwnFrame(name: string): boolean {
    return (
        name.startsWith('auth/') ||
        (name.startsWith('exercises/') && name !== 'exercises/Index') ||
        (name.startsWith('vision/') && name !== 'vision/Index')
    );
}
// layout: (name) => (hasOwnFrame(name) ? null : AppLayout)
```

| Frame | File | Used by | What it does |
|---|---|---|---|
| **AppLayout** | `layouts/AppLayout.vue` | all normal pages | Top bar: logo, menu (`utils/navigation.ts`), today's minutes, theme and language buttons, settings, logout. Messages from the server (`FlashToasts`). Watches the shared props: `setLocale()`, `Amb.initSettings()`, `applyTheme()`, `Amb.setTodayBase()`. |
| **ExerciseShell** | `components/exercise/ExerciseShell.vue` | every exercise page and the calibration | Full screen, no menu. Top bar: "← Menu", title, mode ("Lazy eye: right · red-cyan glasses"), today's minutes, theme, language. Loads settings and previous results into `Amb`, then runs the exercise module (`mountExercise`) and stops everything when you leave. |
| **TestShell** | `components/vision/TestShell.vue` | the three vision tests | Full screen: back link, title, theme, language. Loads the settings and counts the test time as practice `test-vedere` while the test runs. |
| own | `auth/Login.vue`, `auth/Register.vue` | login, register | Centred card on the page background, logo, theme and language buttons. Before login there are no settings, so the theme comes from the browser (`storedTheme()`). |

A page with its own frame must do what AppLayout does for the others (language, theme, settings). The shells already do it.

## Components

| Folder | Component | What it is |
|---|---|---|
| `charts/` | `ChartCanvas.vue` | Thin Chart.js wrapper: draws, redraws when data, options or theme change, destroyed with the component |
| | `MetricChart.vue` | Line chart of one exercise's measured value over time (uses `utils/metrics.ts`) |
| `exercise/` | `ExerciseShell.vue` | Frame of the exercise pages (see above) |
| | `ExerciseGrid.vue` | Exercise cards grouped by kind, with the stats line of each one (when the page sends `summaries`) |
| | `ExerciseIcon.vue` | Small picture of an exercise (inline SVG, or a Lucide icon as fallback) |
| `general/` | `AppCard.vue` | Panel with an optional title, description and action buttons |
| | `PageHeader.vue` | Page title, description and buttons on the right |
| | `StatCard.vue` | Number tile: label, big value, hint, icon |
| | `ProgressRing.vue` | Round progress bar (today's minutes of the goal) |
| | `FlashToasts.vue` | Short messages from the server ("Settings saved.") |
| | `AppLogo.vue` | The logo: an eye with a red and a cyan pupil |
| `layout/` | `LanguageSwitcher.vue` | Română / English menu (`PUT /locale`) |
| | `ThemeSwitcher.vue` | Light / light blue / dark menu (saved in the settings after login, in the browser before) |
| `physical/` | `GuideCard.vue`, `PhysicalTimer.vue`, `PhysicalFigure.vue`, `NpcTracker.vue`, `BarrelCard.vue`, `guide.ts`, `timer.ts` | The physical-exercises page — see [exercises.md](exercises.md#physical-exercises-off-screen-fara-ecran) |
| `vision/` | `TestShell.vue` | Frame of the vision tests |
| | `TestSetup.vue` | First screen of a test: eye, distance, conditions |
| | `LetterKeys.vue` | On-screen letter keys for the letter chart |
| | `TestResult.vue` | End of a test: result, comparison with a month ago and with the first test, note |
| | `VerdictBadge.vue` | "Clear progress / Stable / Weaker" label with an icon (never colour alone) |

## The Amb module

`resources/js/amb/` is the TypeScript version of `assets/common.js` from the first version of the app (same names). Import it with `import Amb from '@/amb'`. It saves to the server by itself: the exercises just call the functions.

**Colours and geometry** — `amb/display.ts`

| Function | What it does |
|---|---|
| `EYE`, `LENS` | Names of the eyes ("stâng" / "left") and lens colours, in the current language |
| `other(eye)` | The other eye (`'left'` ↔ `'right'`) |
| `goodEye()` | The eye that is not lazy |
| `isAnaglyph()` | `true` when you work with red-cyan glasses (`viewMode === 'anaglyph'`) |
| `eyeRGB(eye, intensity)` | RGB colour seen by one eye (`'lazy'`, `'fellow'` = good eye, `'both'`) through its lens |
| `rgb(a)` | `[r, g, b]` → `'rgb(r,g,b)'` |
| `paint(eye, normal, intensity?)` | Colour of a game element: one eye only with the glasses, `normal` with the patch; `'fellow'` uses `fellowContrast` by default |
| `channelMask()` | Per-channel multipliers (0–1) that make a stimulus visible to the lazy eye only |
| `monoColors()` | `{ bg, fg }` for high-contrast stimuli for the lazy eye only |
| `dpr()` | `window.devicePixelRatio` |
| `devPxPerMm()` | Screen (device) pixels per millimetre, from the calibration |
| `devPxPerDeg(distanceCm?)` | Device pixels per degree of visual angle at the exercise distance |
| `devPxToArcmin(px, d?)`, `devPxToArcsec(px, d?)` | Size on screen → minutes / seconds of arc |
| `arcminToDevPx(arcmin, d?)` | Minutes of arc → device pixels |
| `acuityFromArcmin(mar)` | `{ mar, logMAR, decimal, snellen }` |
| `fitCanvas(canvas, w, h, scale)` | Game canvas: you draw in logical units `w × h`; it is shown at `w × scale` CSS px and stays sharp on high-density screens |
| `deviceCanvas(canvas, cssW, cssH)` | Stimulus canvas: you draw in device pixels (one canvas pixel = one screen pixel), needed for exact sizes |
| `modeText()` | "Lazy eye: right · red-cyan glasses" |
| `setupText(kind)` | HTML: how to put on the glasses or the patch, for `'dichoptic'` or `'mono'` exercises |

**Settings** — `amb/settings.ts`

| Function | What it does |
|---|---|
| `settings()` | The current settings (a reactive object, type `AmbSettings`) |
| `set(patch)` | Changes settings now and saves them ~0.4 s later (`PUT /api/settings`) |
| `initSettings(fromServer)` | Called by the layouts with the settings sent by the server |
| `flushSettings(keepalive?)` | Saves pending changes now (also when a page closes) |

**Results** — `amb/results.ts`

| Function | What it does |
|---|---|
| `seedResults(map)` | Called by the shell with the page's `results` prop |
| `results(game)` | Previous results of a series, oldest first (a copy) |
| `saveResult(game, data)` | Adds a result and sends it (`POST /api/results`, queued when offline) |

**Practice time and breaks** — `amb/tracking.ts`

| Function | What it does |
|---|---|
| `startTracking(game, { onPause, onResume })` | Starts counting time for an exercise; `onPause` is called when the tab is hidden or a break starts |
| `setActive(on)` | The game says when you are really playing; only those seconds count |
| `stopTracking()` | Sends the last seconds and stops (the runtime calls it) |
| `flush(keepalive?)` | Sends the counted seconds now (`POST /api/practice`) |
| `setTodayBase(seconds)`, `todaySeconds()` | Today's practice seconds (server value + what this page added) |
| `tracker` | Reactive state (game, active, seconds…) |

**Other**

| Function | File | What it does |
|---|---|---|
| `overlay(html, buttons)` | `overlay.ts` | Pop-up window (intro, pause, results). Links to app pages inside it open without reloading |
| `modalOpen()` | `overlay.ts` | `true` while a pop-up is open (keyboard handlers must then ignore keys) |
| `closeOverlays()` | `overlay.ts` | Closes every pop-up (when leaving a page) |
| `beep(kind)` | `sound.ts` | Short sound: `'ok'`, `'bad'`, `'tick'`, `'win'` (only when sounds are on) |
| `Staircase` | `staircase.ts` | Adaptive difficulty — see [exercises.md](exercises.md#adaptive-difficulty-staircase) |
| `dayKey(date?)` | `time.ts` | `'YYYY-MM-DD'` in the browser's time zone |
| `adjustFellow(delta, reason)` | `index.ts` | Changes the good eye's contrast (0.1–1) and logs it in the `balance` series |
| `go(url)` | `index.ts` | Opens an app page without reloading (closes pop-ups first) |
| `urls` | `index.ts` | `{ home, exercises, calibration, settings, vision }` |

## The exercise runtime

An exercise is a TypeScript module with one default function, `start(rt)`. The page puts the markup inside `<ExerciseShell>`; the shell calls `start(rt)` after the markup is on the page. `rt` (type `Runtime`, `resources/js/exercises/runtime.ts`) gives safe versions of the browser functions:

| `rt.` | Use it instead of |
|---|---|
| `$<T>('id')` | `document.getElementById` (only inside the exercise; throws if missing) |
| `on(target, type, handler)` | `addEventListener` (removed automatically) |
| `timeout`, `interval`, `clearTimeout`, `clearInterval` | `setTimeout`, `setInterval` … |
| `raf(fn)`, `cancelRaf(id)` | `requestAnimationFrame` (game loops) |
| `onCleanup(fn)` | extra clean-up when the page closes |
| `disposed` | `true` after the page closed (stop loops that check it) |
| `root` | the element that holds the exercise markup |

When you leave the page, everything is cleaned up: timers, animation frames, listeners, pop-ups, time tracking, and pending settings are saved. Links like `<a href="/calibrare">` inside the exercise open without a reload.

**Minimal example** — the module:

```ts
// resources/js/exercises/hello.ts
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { t } from '@/i18n';

const ID = 'hello'; // the slug in ExerciseCatalog.php

export default function start(rt: Runtime): void {
    let clicks = 0;
    let running = false;

    rt.on(rt.$('clickBtn'), 'click', () => {
        if (running) {
            clicks++;
            Amb.beep('ok');
        }
    });

    function begin(): void {
        clicks = 0;
        running = true;
        Amb.setActive(true);
        rt.timeout(finish, 30000);
    }

    function finish(): void {
        running = false;
        Amb.setActive(false);
        Amb.saveResult(ID, { clicks, mode: Amb.settings().viewMode });
        Amb.overlay(`<h2>${t('Round finished')}</h2>`, [
            { label: t('Main menu'), onClick: () => Amb.go(Amb.urls.home) },
            { label: t('One more round'), primary: true, onClick: begin },
        ]);
    }

    Amb.startTracking(ID, { onPause: () => Amb.setActive(false) });
    Amb.overlay(`<p>${Amb.setupText('mono')}</p>`, [
        { label: t('Start'), primary: true, onClick: begin },
    ]);
}
```

… and the page:

```vue
<!-- resources/js/pages/exercises/Hello.vue -->
<template>
    <ExerciseShell :exercise="exercise" :results="results" :start="start">
        <div class="ex-hello">
            <main class="game-wrap">
                <div class="stage"><canvas id="cv"></canvas></div>
                <aside class="side">
                    <button id="clickBtn" class="btn primary big wide">
                        {{ $t('Click') }}
                    </button>
                </aside>
            </main>
        </div>
    </ExerciseShell>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import ExerciseShell from '@/components/exercise/ExerciseShell.vue';
import start from '@/exercises/hello';
import type { ExerciseMeta, ResultMap } from '@/types';

export default defineComponent({
    name: 'HelloExercise',
    components: { ExerciseShell },
    props: {
        exercise: { type: Object as PropType<ExerciseMeta>, required: true },
        results: { type: Object as PropType<ResultMap>, required: true },
    },
    setup() {
        return { start };
    },
});
</script>

<style>
/* every selector starts with the page class */
.ex-hello .side .btn {
    min-height: 120px;
}
</style>
```

Rules for exercise code:

- Shared classes (`.btn`, `.stage`, `.side`, `.stat`, `.game-wrap`, `.instr`, `.result-grid`, `.seg`, `kbd`, `.touch-only` …) are in `resources/css/amb.css`. Page styles go in a `<style>` block with every selector prefixed by the page class (`.ex-hello …`).
- Keyboard handlers ignore keys while `Amb.modalOpen()`.
- Never use the raw `setTimeout`, `setInterval`, `requestAnimationFrame` or `document.addEventListener`: use `rt.*`.

## http.ts: JSON calls and the offline queue

`resources/js/lib/http.ts` is used for the `/api/*` calls the exercises make while you play. Pages and forms use Inertia's `router` instead.

- `api(method, url, body)` — `fetch` with the same login session. It sends Laravel's **CSRF token** (a secret per session that protects against forged requests): it reads the `XSRF-TOKEN` cookie and sends it in the `X-XSRF-TOKEN` header. It throws when the answer is not OK.
- `sendOrQueue(method, url, body)` — like `api()`, but when the call fails (no internet, server restarting) it keeps the call in `localStorage` (`lazyeye.queue.v1`, at most 200). Used for data that must not be lost: practice seconds and results.
- `flushQueue()` — sends the kept calls once when the app starts (`app.ts`). Practice time older than 2 days is dropped, because it would land on the wrong day.

Settings use `api()` directly: if saving fails, the change stays pending and is sent with the next change.

## Languages (i18n)

The app speaks **Romanian** (default) and **English**. The rule is the same as Laravel's `__()`: **the text in the code is English, and the English text is the translation key**.

```ts
import { t } from '@/i18n';

t('Eye break');                           // "Pauză pentru ochi" in Romanian
t('You worked :min minutes.', { min: 20 }); // placeholders start with ":"
```

In templates: `{{ $t('Start') }}`, `:aria-label="$t('To the left')"`.

Where the Romanian texts are:

- `resources/js/i18n/ro/<area>.ts` — one file per exercise or page group (`tetris.ts`, `settings.ts`, `common.ts` …). Each one is `export default { 'English text': 'Romanian text' } satisfies Record<string, string>;`. All files are loaded and merged automatically (`import.meta.glob`).
- `lang/ro.json` — texts that come from the server (catalog titles, flash messages). Also loaded on the Vue side.

A text without a Romanian translation is shown in English.

The language comes from the server (prop `locale`, kept in the session and a cookie). `LanguageSwitcher` changes it with `PUT /locale`. The frames call `setLocale()`. Other helpers: `getLocale()` (`'ro'` / `'en'`) and `intlLocale()` (`'ro-RO'` / `'en-GB'`) for numbers and dates — use `formatNumber()`, `formatDate()` … from `utils/format.ts`.

**How to add a text**

1. Write it in English in the code: `t('Smallest easy print')` or `$t('…')`.
2. Add the Romanian to the dictionary of that area: `'Smallest easy print': 'Cel mai mic text citit ușor',`.
3. If the same English key exists in another file, its Romanian must be **identical** (all files are merged into one table; the last one wins). Avoid one-word keys that mean different things in Romanian — e.g. `left` is "stâng" for an eye but "stânga" for a direction. Use the full phrase, or `Amb.EYE`.
4. Long paragraphs (the guide, the physical exercises, the reading texts) may instead be written as `{ ro: '…', en: '…' }` objects and picked with `getLocale()`.

## Colour themes

There are three themes: **light** (default), **light blue** and **dark** (`resources/js/utils/theme.ts`).

- The theme is the setting `theme` (`Amb.set({ theme })` saves it). Before login it is kept in the browser (`localStorage` key `lazyeye.theme`).
- `applyTheme(theme)` sets `data-theme` on `<html>`. The Blade template (`resources/views/app.blade.php`) already sets it in the HTML, so the page never flashes in the wrong theme.
- Other helpers: `THEMES`, `THEME_LABELS`, `storedTheme()`, `themeState` (reactive, charts read it to redraw), `cssColor('--color-muted')` (reads a theme colour in JavaScript).

The colours are **CSS variables** in `resources/css/app.css`: the light values in Tailwind's `@theme`, the others in `:root[data-theme='blue']` and `:root[data-theme='dark']`. Tailwind makes classes from them, so in pages use **only** these classes, never hex colours:

`bg-ink` (page), `bg-header`, `bg-panel`, `bg-panel-2`, `bg-hover`, `border-line`, `border-line-2`, `text-fg`, `text-muted`, `text-accent`, `bg-accent`, `text-accent-ink`, `text-good`, `text-bad`, `text-warn`, plus the classes `.panel`, `.form-label`, `.form-control`, `.form-error`.

`resources/css/amb.css` maps the same colours to the short names of the exercise pages (`--bg`, `--panel`, `--line`, `--text`, `--muted`, `--accent`, `--hover` …).

**Why the stage stays black.** The game and stimulus area (`.stage` and the canvases) is black in every theme. Red-cyan glasses separate the two pictures well only on black: on a white background each lens lets through a lot of the other eye's picture. The colours drawn inside the canvases come from `Amb` (lens colours), not from the theme.

## Charts

`resources/js/utils/charts.ts` sets up Chart.js once for the whole app:

- `series(i)` — categorical colour number `i`, always in the same order. The six colours per theme are CSS variables (`--series-1` … `--series-6`), checked for colour-blind readers on the light and on the dark panel.
- `GROUP_ORDER`, `GROUP_LABELS`, `groupColor(group)` — colours of the kinds of exercise (stacked bars on the reports).
- `eyeColor(eye)` — right / left / both eyes in the vision charts.
- `heatColors()` — the calendar colours (`--heat-0` … `--heat-4`).
- `goalLine` — plugin that draws a dashed line at the daily goal.
- `baseOptions(format)` — common options: light grid, tooltips, legend at the bottom, text and grid colours from the theme, numbers in the current language.

Charts read `themeState`, so they redraw when the theme changes. Draw them with `components/charts/ChartCanvas.vue`. The value followed for each exercise on the reports is defined in `utils/metrics.ts` (label, unit, `lowerIsBetter`, decimals, `value(result)`); when lower is better the axis is flipped, so **up always means better**.

## Types

| File | Types |
|---|---|
| `types/index.ts` | `ExerciseMeta` (one catalog entry), `ResultMap` (series → results), vision tests: `VisionTypeKey`, `EyeKey`, `VisionTestRow`, `VisionDay`, `VisionDelta`, `VisionComparison` |
| `types/auth.ts` | `User`, `Auth` (`user`, `loginRequired`) |
| `types/global.d.ts` | The shared Inertia page props (`this.$page.props` is typed), the `v-focus` directive, Vite env variables |
| `amb/index.ts` | `AmbSettings`, `AmbResult` (`{ g, t, d, …data }`), `OverlayButton`, `StaircaseOptions` |
| `i18n/index.ts` | `Locale`, `Replacements`, and the type of `$t` in templates |

Checks: `npm run types:check` (`vue-tsc --noEmit`, the TypeScript check) and `npm run check` (`vp check`, the project checks of Vite+; `npm run check:fix` repairs what it can).

## How to add a new exercise

1. **Catalog entry** in `app/Support/ExerciseCatalog.php`: `slug`, `title`, `group`, `page`, `description`, `trains`, `minutes` (English). The slug is used in the URL (`/exercitii/{slug}`), for practice time and for results — the server accepts it automatically. If the page needs other result series (e.g. `balance`), add them in `extraResultKeys()`.
2. **Romanian of the catalog texts** in `lang/ro.json` (title, description, trains).
3. **Module** `resources/js/exercises/<name>.ts` with `export default function start(rt: Runtime)`:
   - `const ID = '<slug>'`; `Amb.startTracking(ID, { onPause })`; `Amb.setActive(true / false)`;
   - an intro pop-up with `Amb.setupText('mono' | 'dichoptic')`;
   - colours only through `Amb.paint()`, `monoColors()`, `channelMask()`, so both glasses and patch work;
   - at the end `Amb.saveResult(ID, { …, mode: Amb.settings().viewMode })`.
4. **Page** `resources/js/pages/exercises/<Name>.vue` (the name in the catalog's `page`): markup inside `<ExerciseShell>`, props `exercise` and `results`, `setup() { return { start }; }`, styles prefixed with `.ex-<name>`, theme variables only (the stage stays black).
5. **Romanian dictionary** `resources/js/i18n/ro/<name>.ts` for every `t()` / `$t()` text.
6. **Icon** in `resources/js/components/exercise/ExerciseIcon.vue`: a 36 × 36 SVG in `ICONS`, or a Lucide icon in `FALLBACK`.
7. **Stats line** of the card in `resources/js/utils/exerciseStats.ts` (a `case` for the slug).
8. **Metric** for the reports chart in `resources/js/utils/metrics.ts`.
9. **Daily program** (optional): add the slug to `DICHOPTIC` or `MONO` in `app/Services/DailyPlanService.php`, or add a step.
10. A **new group** also needs a section in `components/exercise/ExerciseGrid.vue` and an entry in `GROUP_ORDER` / `GROUP_LABELS` of `utils/charts.ts`.
11. **Check:** `npm run types:check`; try the exercise with glasses and with the patch, in both languages, in the three themes and on a phone-width screen; check that the result appears on the card and on the reports.
