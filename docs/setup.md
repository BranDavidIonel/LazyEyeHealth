# Setup: local and live

## Requirements

- PHP **8.5** with `pdo_sqlite` (local) / `pdo_mysql` (live), `intl`, `mbstring`, `zip`
  (on this laptop: `C:\xampp\php_8.5.12`, chosen automatically by `C:\xampp\bin\php.bat` thanks to the `.php-version` file)
- Composer 2, Node 26+
- Locally nothing else: the database is a SQLite file. Live: MySQL 8+.

## Run locally (Windows, XAMPP)

```bash
composer install
copy .env.example .env          # then edit it, see below
php artisan key:generate
php artisan migrate --seed       # tables + the admin user from .env
npm install
npm run build                    # or "npm run dev" for hot reload (Vite on port 5173)
php artisan serve --port=8040    # http://127.0.0.1:8040
```

The project's `.claude/launch.json` starts the same server on port **8040** (ports 8010–8030 are used by other projects on this laptop).

Local `.env`:

```dotenv
APP_ENV=local
APP_LOCALE=ro
APP_TIMEZONE=Europe/Bucharest
DB_CONNECTION=sqlite

AUTH_ENABLED=false               # no login page locally: you are the admin below
ADMIN_EMAIL=admin@yahoo.com
ADMIN_PASSWORD="..."             # quotes because of special characters like %
```

## Put it live (checklist)

> Nothing is deployed automatically. These are the steps for when you decide to.

1. Server with PHP 8.5, MySQL, a web server pointing to `public/` (Apache/Nginx) and HTTPS.
2. `git clone https://github.com/BranDavidIonel/LazyEyeHealth.git`
3. `.env` for production:

   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=lazyeyehealth
   DB_USERNAME=...
   DB_PASSWORD=...
   AUTH_ENABLED=true             # with APP_ENV=production the login is on anyway
   REGISTRATION_ENABLED=false    # true only if other people may create accounts
   ADMIN_EMAIL=admin@yahoo.com
   ADMIN_PASSWORD="a strong password"
   SESSION_SECURE_COOKIE=true
   ```

4. Commands:

   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan key:generate
   php artisan migrate --force
   php artisan db:seed --force   # creates / updates the admin from .env
   npm ci && npm run build
   php artisan optimize
   ```

5. More users: `php artisan app:user ana@example.com --name="Ana"` (asks for the password).

## Tests

```bash
php artisan test        # PHPUnit feature tests (in-memory SQLite)
npx vue-tsc --noEmit    # TypeScript check of the Vue/TS code
```

## Useful commands

| Command | What it does |
|---|---|
| `php artisan migrate:fresh --seed` | Empty database + admin (deletes all data!) |
| `php artisan app:user email --password=...` | Create a user / change a password |
| `php artisan route:list --except-vendor` | All routes |
| `npm run build` | Build the Vue app into `public/build` |
