@echo off
echo 🚀 Deploying PDF Chat to Railway...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI not found. Installing...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Railway CLI. Please install manually:
        echo    npm install -g @railway/cli
        pause
        exit /b 1
    )
)

echo ✅ Railway CLI found!

REM Login to Railway
echo 🔐 Logging in to Railway...
railway login
if %errorlevel% neq 0 (
    echo ❌ Failed to login to Railway
    pause
    exit /b 1
)

REM Initialize project
echo 📦 Initializing Railway project...
railway init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize project
    pause
    exit /b 1
)

REM Set environment variables
echo 🔧 Setting up environment variables...
echo.
echo Please set the following environment variables in Railway dashboard:
echo    GOOGLE_API_KEY=your_google_api_key_here
echo    FLASK_ENV=production
echo.

REM Deploy
echo 🚀 Deploying to Railway...
railway up
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Deployment successful!
echo 🌐 Your app will be available at the Railway URL shown above
echo.
echo 📋 Next steps:
echo    1. Set your GOOGLE_API_KEY in Railway dashboard
echo    2. Wait for deployment to complete
echo    3. Test your application
echo.
pause
