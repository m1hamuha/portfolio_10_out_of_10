# Vercel Deployment Guide

## Quick Deploy

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

## Environment Variables

Configure these in Vercel Project Settings > Environment Variables:

### Required
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GITHUB_CLIENT_ID` - From GitHub OAuth App
- `GITHUB_CLIENT_SECRET` - From GitHub OAuth App
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - From [OpenRouter](https://openrouter.ai)

### Optional
- `OPENROUTER_SITE_URL` - Your Vercel domain
- `OPENROUTER_APP_NAME` - "AI CopilotCoach"
- `CRON_SECRET` - For cron job authentication
- `LOG_LEVEL` - "debug", "info", "warn", or "error"

## Database Setup

### Option 1: Vercel Postgres (Recommended)
1. Create Postgres database in Vercel Dashboard
2. Copy connection string to `DATABASE_URL`

### Option 2: Supabase
1. Create new Supabase project
2. Go to Settings > Database
3. Copy connection string
4. Update `DATABASE_URL`

### Option 3: Railway/Render
1. Create PostgreSQL database
2. Copy connection string

## GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Configure:
   - **Application name**: AI CopilotCoach
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy Client ID and Client Secret to Vercel

## Post-Deployment Steps

### 1. Run Database Migration
Vercel automatically runs migrations on deploy. If needed:
```bash
npx prisma migrate deploy
```

### 2. Verify Cron Job
The cleanup cron runs daily at 2 AM. Verify in Vercel:
1. Project Settings > Cron Jobs
2. Should see `/api/cron/cleanup` enabled

### 3. Test Authentication
1. Visit your deployed app
2. Click "Sign in with GitHub"
3. Complete OAuth flow
4. Verify you're redirected to `/coach`

## Monitoring

### Error Tracking (Sentry)
```bash
npm i @sentry/nextjs
```

Add to `next.config.js`:
```js
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  // your next.config.js options
});
```

### Analytics (Plausible)
Add to `_layout.tsx` head:
```jsx
<script
  defer
  data-domain="your-domain.vercel.app"
  src="https://plausible.io/js/script.js"
/>
```

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly
- Check database is not sleeping (Supabase may idle)

### "OAuth callback error"
- Verify callback URL matches GitHub OAuth App settings
- Ensure Client ID/Secret are correct

### "Module not found" errors
- Run `npx prisma generate` locally
- Commit generated files if needed

## Rollback

1. Vercel Dashboard > Deployments
2. Select previous deployment
3. Click "Rollback"
