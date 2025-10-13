# Vercel Deployment Instructions

## Environment Variables Required

Add these environment variables in your Vercel Dashboard under **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://guzeszmhrfalbvamzxgg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1emVzem1ocmZhbGJ2YW16eGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEyMzgsImV4cCI6MjA3NDk5NzIzOH0.JtNrTq7AEzMARsCestD2jCtSpp0qcoJczcnFbistp6s
```

## Build Settings

Vercel should automatically detect Next.js. If not, use these settings:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x

## Troubleshooting

1. Check deployment logs in Vercel Dashboard
2. Ensure all environment variables are set
3. Verify Git integration is connected to the correct repository
4. Make sure `pnpm-lock.yaml` is committed

## Testing Locally

```bash
pnpm install
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
