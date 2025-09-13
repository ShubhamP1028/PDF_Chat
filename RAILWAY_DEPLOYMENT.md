# PDF Chat - Railway Deployment Guide

This guide will help you deploy your PDF Chat application to Railway.

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your Repository
1. Make sure all files are committed to your Git repository
2. Push your code to GitHub/GitLab/Bitbucket

### Step 2: Deploy to Railway (Web-based - Recommended)

#### Method 1: Deploy from GitHub
1. Go to [Railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your PDF Chat repository
6. Railway will automatically detect it's a Python app

#### Method 2: Deploy with Railway CLI (if you have Node.js)
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
2. Login to Railway:
   ```bash
   railway login
   ```
3. Initialize project:
   ```bash
   railway init
   ```
4. Deploy:
   ```bash
   railway up
   ```

#### Method 3: Manual Upload (if no Git)
1. Go to [Railway.app](https://railway.app)
2. Sign in with your account
3. Click "New Project"
4. Select "Deploy from folder"
5. Upload your project folder

### Step 3: Configure Environment Variables
In your Railway dashboard:
1. Go to your project
2. Click on "Variables" tab
3. Add the following environment variables:

```
GOOGLE_API_KEY=your_actual_google_api_key_here
FLASK_ENV=production
```

### Step 4: Get Your Railway URL
1. Go to your project dashboard
2. Click on "Settings"
3. Find your "Railway URL" (it will be something like: `https://your-app-name.railway.app`)

## 🔧 Configuration Files Created

### `railway.json`
- Railway-specific configuration
- Build and deployment settings

### `Procfile`
- Process file for Railway
- Specifies how to run your app

### Updated `app.py`
- Modified to use Railway's PORT environment variable
- Set to run on `0.0.0.0` for external access
- Disabled debug mode for production

### Updated `requirements.txt`
- Added specific versions for better compatibility
- Added Gunicorn for production WSGI server

## 🌐 Access Your Application

Once deployed, your PDF Chat will be available at:
- **Railway URL**: `https://your-app-name.railway.app`
- **Custom Domain**: You can add a custom domain in Railway settings

## 📱 Features Available

Your deployed application will have:
- ✅ Professional dark theme with "PAL" branding
- ✅ PDF upload and processing
- ✅ Multi-document support
- ✅ AI-powered chat with sources
- ✅ Mobile-responsive design
- ✅ Document management controls

## 🔒 Security Notes

1. **Environment Variables**: Never commit your `.env` file
2. **API Keys**: Set them in Railway's environment variables
3. **File Storage**: Railway provides temporary storage (files are lost on restart)
4. **Database**: Consider using Railway's PostgreSQL addon for persistent storage

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check if all dependencies are in `requirements.txt`
   - Ensure Python version is compatible

2. **App Crashes on Startup**
   - Check environment variables are set
   - Look at Railway logs for error messages

3. **File Upload Issues**
   - Railway has file size limits
   - Files are stored temporarily

### View Logs:
1. Go to your Railway project
2. Click on "Deployments"
3. Click on your latest deployment
4. View logs in real-time

## 📊 Monitoring

Railway provides:
- Real-time logs
- Performance metrics
- Automatic deployments
- Health checks

## 🔄 Updates

To update your app:
1. Push changes to your Git repository
2. Railway will automatically redeploy
3. Your app will be updated with zero downtime

## 💰 Pricing

Railway offers:
- Free tier with limited usage
- Pay-as-you-go pricing
- No credit card required for free tier

---

**Your PDF Chat application is now ready for Railway deployment!**

After deployment, you'll get a public URL that you can share with anyone to access your PDF Chat application.
