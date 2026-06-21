@echo off
chcp 65001
cls
echo ==========================================
echo  AIShield Lab - Cloudflare Pages Deploy
echo ==========================================
echo.

where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo [1/4] Installing wrangler...
    call npm install -g wrangler
) else (
    echo [1/4] wrangler already installed
)

echo.
echo [2/4] Building project...
cd /d "D:\trae_projects\fancraft"
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Checking dist3 folder...
if not exist "dist3\index.html" (
    echo Error: dist3/index.html not found!
    pause
    exit /b 1
)
echo dist3 folder ready

echo.
echo [4/4] Deploying to Cloudflare Pages...
echo If not logged in, a browser will open for login
echo.
wrangler pages deploy dist3 --project-name=aishield-lab

echo.
echo ==========================================
echo  Deploy complete!
echo ==========================================
pause
