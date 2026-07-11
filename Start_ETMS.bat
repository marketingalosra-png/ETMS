@echo off
title Employee Training Management System
color 0A

cd /d "C:\Users\Newtech\Desktop\AI\etms"

echo ===========================================
echo Employee Training Management System
echo ===========================================
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker Desktop is not running.
    echo Please start Docker Desktop first.
    pause
    exit /b
)

echo Starting PostgreSQL...
docker compose up -d

echo.
echo Generating Prisma Client...
call npx prisma generate

echo.
echo Syncing Database...
call npx prisma db push

echo.
echo Starting ETMS...
start "" cmd /k "cd /d C:\Users\Newtech\Desktop\AI\etms && npm run dev"

echo Waiting for Next.js to start...
timeout /t 10 /nobreak >nul

start "" http://localhost:3000

echo.
echo ETMS is starting...
echo.
echo Browser opened at:
echo http://localhost:3000
echo.
pause