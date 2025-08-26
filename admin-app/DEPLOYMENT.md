# Faded Skies Admin App - Deployment Guide

## 🚀 Deploy to Web Domain

This admin app is configured for deployment to a web hosting service so it can be accessed from anywhere, not just localhost.

## 📋 Prerequisites

1. **GitHub Account** - For code repository
2. **Vercel Account** - For free hosting (recommended)
3. **Supabase Project** - Already configured

## 🎯 Quick Deploy to Vercel (Recommended)

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial admin app commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/faded-skies-admin.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite React app
   - Click "Deploy"

3. **Set Environment Variables:**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL`: `https://hdqbnhtimuynuypwouwf.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project or create new
   - Set environment variables when prompted

## 🌐 Alternative Hosting Options

### Netlify
- Similar to Vercel
- Drag & drop `dist` folder after build
- Set environment variables in dashboard

### GitHub Pages
- Free hosting for static sites
- Requires custom domain for HTTPS

### Firebase Hosting
- Google's hosting service
- Good for static sites

## 🔧 Environment Variables

The app uses these environment variables:

```env
VITE_SUPABASE_URL=https://hdqbnhtimuynuypwouwf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ
```

## 🎨 Custom Domain

After deployment, you can:

1. **Use Vercel's free domain** (e.g., `your-app.vercel.app`)
2. **Add custom domain** in Vercel dashboard
3. **Configure DNS** for your domain

## 🔄 Continuous Deployment

- **Automatic**: Every push to main branch triggers new deployment
- **Preview**: Pull requests get preview URLs
- **Rollback**: Easy rollback to previous versions

## 🛡️ Security

- HTTPS enabled by default
- Environment variables are encrypted
- No sensitive data in client-side code
- Supabase handles authentication securely

## 📱 Access

Once deployed, your admin app will be available at:
- **Vercel URL**: `https://your-app-name.vercel.app`
- **Custom Domain**: `https://admin.yourdomain.com` (if configured)

## 🔍 Testing Deployment

1. **Build locally:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Test production build:**
   - Visit your deployed URL
   - Test admin login/signup
   - Verify real-time data loading
   - Check all admin functions

## 🚨 Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed
- Check environment variables

### Runtime Errors
- Check browser console for errors
- Verify Supabase connection
- Check environment variables in hosting platform

### Authentication Issues
- Verify Supabase URL and key
- Check email confirmation settings
- Test with different admin accounts

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev)

