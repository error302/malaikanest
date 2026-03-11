@echo off
REM =============================================================================
REM MALAIKA NEST - Local Setup Script (Windows)
REM =============================================================================
REM Run this from the backend folder: cd malaika nest\backend
REM Then run: setup_local.bat
REM =============================================================================

echo.
echo ============================================
echo   Malaika Nest - Local Setup
echo ============================================
echo.

REM Find PostgreSQL installation path
set "PSQL_PATH="
for /d %%d in ("C:\Program Files\PostgreSQL\*") do (
    set "PSQL_PATH=%%d\bin"
)
if "%PSQL_PATH%"=="" (
    for /d %%d in ("C:\Program Files (x86)\PostgreSQL\*") do (
        set "PSQL_PATH=%%d\bin"
    )
)
if "%PSQL_PATH%"=="" (
    echo PostgreSQL not found. Please install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo Found PostgreSQL at: %PSQL_PATH%

REM Check if PostgreSQL service is running and try to start it
echo [1/5] Checking PostgreSQL...

REM Try different PostgreSQL versions
set "SERVICE_FOUND=0"

sc query postgresql-x64-18 >nul 2>&1
if %errorlevel%==0 (
    set "PG_SERVICE=postgresql-x64-18"
    set "SERVICE_FOUND=1"
)
sc query postgresql-x64-17 >nul 2>&1
if %errorlevel%==0 (
    set "PG_SERVICE=postgresql-x64-17"
    set "SERVICE_FOUND=1"
)
sc query postgresql-x64-16 >nul 2>&1
if %errorlevel%==0 (
    set "PG_SERVICE=postgresql-x64-16"
    set "SERVICE_FOUND=1"
)
sc query postgresql-x64-15 >nul 2>&1
if %errorlevel%==0 (
    set "PG_SERVICE=postgresql-x64-15"
    set "SERVICE_FOUND=1"
)
sc query postgresql-x64-14 >nul 2>&1
if %errorlevel%==0 (
    set "PG_SERVICE=postgresql-x64-14"
    set "SERVICE_FOUND=1"
)

if %SERVICE_FOUND%==0 (
    echo PostgreSQL service not found. Please install PostgreSQL.
    pause
    exit /b 1
)

REM Check if service is running, if not try to start it
sc query %PG_SERVICE% | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running. Attempting to start...
    net start %PG_SERVICE% 2>nul
    if %errorlevel% neq 0 (
        echo Could not start PostgreSQL automatically.
        echo Please start PostgreSQL from Services app manually.
        pause
        exit /b 1
    )
    echo Started PostgreSQL service.
    timeout /t 3 >nul
)
echo OK - PostgreSQL is running

REM Create database (drop first if exists to handle inconsistent migration state)
echo [2/5] Creating database...
"%PSQL_PATH%\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS malaika_db;" 2>nul
"%PSQL_PATH%\psql.exe" -U postgres -c "CREATE DATABASE malaika_db OWNER postgres;" 2>nul
echo OK - Database created (fresh)

REM Create .env file
echo [3/5] Creating environment file...
(
echo DEBUG=True
echo SECRET_KEY=django-insecure-ksjdfhkjshdfkjshdfkjshdfkjshdfkjshdfkjshdfk
echo SIMPLE_JWT_SECRET=jwt-secret-key-here-change-in-production
echo DB_NAME=malaika_db
echo DB_USER=postgres
echo DB_PASSWORD=postgres
echo DB_HOST=localhost
echo DB_PORT=5432
echo ALLOWED_HOSTS=localhost,127.0.0.1
echo EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
echo CLOUDINARY_NAME=placeholder
echo CLOUDINARY_KEY=placeholder
echo CLOUDINARY_SECRET=placeholder
echo MPESA_CONSUMER_KEY=test
echo MPESA_CONSUMER_SECRET=test
echo MPESA_PASSKEY=test
echo MPESA_ENV=sandbox
) > .env
echo OK - .env file created

REM Run migrations
echo [4/5] Running migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo.
    echo Error running migrations!
    echo Make sure you have Django installed: pip install -r requirements.txt
    pause
    exit /b 1
)
echo OK - Migrations complete

REM Create superuser
echo [5/5] Creating admin user...
echo.
echo Please create your admin account when prompted:
python manage.py createsuperuser

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start the server, run:
echo   python manage.py runserver
echo.
echo Admin URL: http://localhost:8000/admin
echo.

pause



