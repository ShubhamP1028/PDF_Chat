@echo off
echo 🚀 PDF Chat - Railway Quick Deploy
echo ====================================
echo.

echo 📋 Pre-deployment checklist:
echo ✅ All Railway files created
echo ✅ Flask app configured for Railway
echo ✅ Requirements.txt updated
echo ✅ Environment variables template ready
echo.

echo 🎯 Next steps to get your Railway link:
echo.
echo 1. Push your code to GitHub:
echo    git add .
echo    git commit -m "Prepare for Railway deployment"
echo    git push origin main
echo.
echo 2. Deploy to Railway:
echo    - Go to https://railway.app
echo    - Sign in with GitHub
echo    - Click "New Project"
echo    - Select "Deploy from GitHub repo"
echo    - Choose your PDF Chat repository
echo.
echo 3. Set environment variables in Railway:
echo    - GOOGLE_API_KEY=your_actual_google_api_key_here
echo    - FLASK_ENV=production
echo.
echo 4. Wait for deployment to complete
echo    - Railway will provide your live URL
echo    - Format: https://your-app-name.railway.app
echo.
echo 📱 Your app will be accessible from anywhere!
echo 🌐 Share the Railway URL with anyone
echo.
echo 📖 For detailed instructions, see:
echo    - RAILWAY_DEPLOYMENT.md
echo    - DEPLOYMENT_CHECKLIST.md
echo.
pause
