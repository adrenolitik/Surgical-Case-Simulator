# Deployment Guide for Netlify

This guide will help you deploy your Surgical Case Simulator to Netlify.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Netlify account (free tier is sufficient)
3. A Google Gemini API key from https://aistudio.google.com/app/apikey

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

Make sure all your code is pushed to GitHub:
```bash
git add -A
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Netlify

1. Go to https://app.netlify.com/
2. Click "Add new site" button
3. Select "Import an existing project"
4. Choose "Deploy with GitHub"
5. Authorize Netlify to access your GitHub account if prompted

### Step 3: Select Repository

1. Find and select your repository: `adrenolitik/Surgical-Case-Simulator`
2. Click on the repository name

### Step 4: Configure Build Settings

Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

### Step 5: Add Environment Variables

**CRITICAL STEP** - Without this, your app won't work!

1. Before clicking "Deploy site", click "Show advanced"
2. Click "New variable"
3. Add the following:
   - **Key**: `VITE_API_KEY`
   - **Value**: Your Gemini API key from https://aistudio.google.com/app/apikey

### Step 6: Deploy

1. Click "Deploy site"
2. Wait for the build to complete (usually 2-3 minutes)
3. Once complete, you'll get a URL like: `https://random-name-123456.netlify.app`

### Step 7: Custom Domain (Optional)

1. Go to "Site configuration" → "Domain management"
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS

## Troubleshooting

### Issue: "API key not configured" error

**Solution**: Make sure you set the `VITE_API_KEY` environment variable in Netlify:
1. Go to Site configuration → Environment variables
2. Add `VITE_API_KEY` with your Gemini API key
3. Redeploy the site

### Issue: Build fails

**Solution**: Check the build logs:
1. Go to Deploys tab
2. Click on the failed deploy
3. Check the deploy log for errors
4. Common issues:
   - Missing dependencies → Run `npm install` locally first
   - Node version → Ensure Node 20+ is specified in netlify.toml

### Issue: 404 errors on page refresh

**Solution**: This is already handled in `netlify.toml` with the redirect rule. If you still see issues:
1. Check that `netlify.toml` is in the root of your repository
2. Make sure the redirects section is present

### Issue: App loads but shows errors in console

**Solution**: 
1. Open browser console (F12)
2. Look for API key errors
3. Verify `VITE_API_KEY` is set correctly in Netlify
4. Verify your Gemini API key is valid and has proper permissions

## Updating Your Deployment

To update your deployed site:

1. Make changes to your code
2. Commit and push:
   ```bash
   git add -A
   git commit -m "Your update message"
   git push origin main
   ```
3. Netlify will automatically rebuild and redeploy

## Manual Redeploy

If you need to manually trigger a redeploy:

1. Go to Deploys tab in Netlify dashboard
2. Click "Trigger deploy" → "Deploy site"

## Environment Variables After Initial Deployment

To add or update environment variables after deployment:

1. Go to Site configuration → Environment variables
2. Click "Add a variable" or edit existing ones
3. Click "Save"
4. Trigger a redeploy for changes to take effect

## Security Best Practices

⚠️ **IMPORTANT**: 
- Never commit your `.env.local` file to Git
- Never expose your Gemini API key in client-side code (it's embedded during build)
- Consider setting up API key restrictions in Google Cloud Console
- Monitor your API usage at https://aistudio.google.com/

## Getting Help

If you encounter issues:

1. Check Netlify build logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure your Gemini API key is valid

## Your Current Deployment

Site: https://surgical-case-simulator-appendicitis.netlify.app/
Repository: https://github.com/adrenolitik/Surgical-Case-Simulator

---

Last updated: January 2026
