@echo off
rem Double-click: prepares and starts LazyEyeHealth on http://127.0.0.1:8040
rem  - first time: installs the packages, creates .env and the SQLite database (local mode, no login)
rem  - every time: runs new migrations, builds the Vue app, starts the server and opens the browser
rem Uses PHP 8.5 from XAMPP and its own port, so Apache, MySQL and the other projects are not touched.
rem Close the "LazyEyeHealth server" window to stop it. "start-local.bat nobrowser" does not open the browser.
setlocal
title LazyEyeHealth
cd /d "%~dp0"

set "PHP=C:\xampp\php_8.5.12\php.exe"
set "COMPOSER=C:\xampp\php\composer.phar"
set "PORT=8040"
set "URL=http://127.0.0.1:%PORT%"

if not exist "%PHP%" (
    echo PHP 8.5 was not found at %PHP%
    goto :error
)

rem Already running? Only open the browser.
netstat -ano | findstr /R /C:"127.0.0.1:%PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo LazyEyeHealth is already running: %URL%
    if /i not "%~1"=="nobrowser" start "" "%URL%"
    exit /b 0
)

if not exist "vendor\autoload.php" (
    echo Installing the PHP packages...
    "%PHP%" "%COMPOSER%" install --no-interaction || goto :error
)

if not exist ".env" (
    echo Creating .env for local use ^(no login page^)...
    copy ".env.example" ".env" >nul
    powershell -NoProfile -Command "(Get-Content .env) -replace '^AUTH_ENABLED=.*','AUTH_ENABLED=false' | Set-Content -Encoding utf8 .env"
    "%PHP%" artisan key:generate --ansi || goto :error
)

set "NEW_DB="
if not exist "database\database.sqlite" (
    type nul > "database\database.sqlite"
    set "NEW_DB=1"
)
"%PHP%" artisan migrate --force --ansi || goto :error
if defined NEW_DB "%PHP%" artisan db:seed --force --ansi

if not exist "node_modules" (
    echo Installing the JavaScript packages...
    call npm install --no-audit --no-fund || goto :error
)

echo Building the app...
call npm run build >nul || goto :error

echo Starting LazyEyeHealth on %URL% ...
start "LazyEyeHealth server (close this window to stop)" /min "%PHP%" artisan serve --host=127.0.0.1 --port=%PORT%
ping -n 3 127.0.0.1 >nul
if /i not "%~1"=="nobrowser" start "" "%URL%"
exit /b 0

:error
echo.
echo Something went wrong - see the messages above.
pause
exit /b 1
