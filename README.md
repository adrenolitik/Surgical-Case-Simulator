<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Surgical Case Simulator - Appendicitis

Interactive medical training simulator powered by Google Gemini AI.

View your app in AI Studio: https://ai.studio/apps/drive/14UQVyUJmC3zbwK9aSXej4XOQpF6vJqPA

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file with your Gemini API key:
   ```bash
   VITE_API_KEY=your_gemini_api_key_here
   ```
   Get your API key from: https://aistudio.google.com/app/apikey

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Netlify

### Option 1: Deploy via Netlify UI

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variable in Netlify dashboard:
   - Key: `VITE_API_KEY`
   - Value: Your Gemini API key
7. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

4. Set environment variable:
   ```bash
   netlify env:set VITE_API_KEY "your_gemini_api_key_here"
   ```

## Important Notes

⚠️ **API Key Security**: Never commit your `.env.local` file to Git. Always set the API key as an environment variable in Netlify dashboard.

⚠️ **Environment Variables**: Make sure to set `VITE_API_KEY` in your Netlify site settings under "Site configuration" → "Environment variables".
