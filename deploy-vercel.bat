@echo off
echo ========================================
echo   Deploy NACOS Frontend to Vercel
echo ========================================
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI not found!
    echo.
    echo Please install it first:
    echo   npm install -g vercel
    echo.
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Check if we're in the frontend directory
if not exist "index.html" (
    echo [ERROR] index.html not found!
    echo Make sure you're in the frontend directory
    echo.
    pause
    exit /b 1
)

echo Deploying to Vercel...
echo.
echo This will:
echo 1. Upload your frontend files
echo 2. Create a preview deployment
echo 3. Give you a URL to test
echo.

REM Deploy to Vercel
vercel

echo.
echo ========================================
echo   Deployment initiated!
echo ========================================
echo.
echo Next steps:
echo 1. Test the preview URL provided above
echo 2. If everything works, deploy to production:
echo      vercel --prod
echo.
echo 3. Update Railway FRONTEND_URL to your Vercel URL
echo 4. Restart Railway backend service
echo.
pause
