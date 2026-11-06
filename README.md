# LazyEyeHealth

Vision training for an amblyopic ("lazy") eye and divergent strabismus: dichoptic games with red-cyan glasses, perceptual-learning exercises, stereo and convergence training, physical exercises, daily progress, reports and home vision tests compared month by month.

Laravel 13 · Inertia v3 · Vue 3 + TypeScript · Tailwind 4 · Chart.js — Romanian (default) and English, light / blue / dark themes.

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm run build && php artisan serve --port=8040
```

Documentation: **[docs/README.md](docs/README.md)** (overview, setup, database, backend, frontend, exercises, vision tests).

> The exercises complement the treatment prescribed by an eye doctor; they do not replace it.
