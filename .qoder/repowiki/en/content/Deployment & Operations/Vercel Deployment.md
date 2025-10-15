# Vercel Deployment

<cite>
**Referenced Files in This Document**   
- [vercel.json](file://vercel.json)
- [next.config.ts](file://next.config.ts)
- [package.json](file://package.json)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Variable Configuration](#environment-variable-configuration)
3. [Framework Detection and Build Settings](#framework-detection-and-build-settings)
4. [vercel.json Configuration](#verceljson-configuration)
5. [Local Testing Instructions](#local-testing-instructions)
6. [Common Deployment Issues](#common-deployment-issues)
7. [Deployment Verification](#deployment-verification)
8. [Performance Considerations](#performance-considerations)

## Introduction
This document provides comprehensive instructions for deploying the persona application on Vercel, a cloud platform optimized for Next.js applications. The deployment process leverages Vercel's seamless integration with Next.js to enable fast, reliable, and scalable hosting. The application uses Supabase for backend services and is built using modern React with Server Components via Next.js App Router. This guide covers all aspects of deployment including environment configuration, build settings, local testing, troubleshooting, and performance optimization.

**Section sources**
- [README.md](file://README.md#L31-L36)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L1-L5)

## Environment Variable Configuration
Proper configuration of environment variables is critical for the application to connect to external services, particularly Supabase. The following environment variables must be set in the Vercel dashboard under **Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`: The public URL of the Supabase project, used by both client and server components to establish connections.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous public key for Supabase, enabling unauthenticated access to public data and authentication flows.
- `SUPABASE_SERVICE_ROLE_KEY`: A sensitive service role key that grants full access to the database (should only be used in server contexts).
- `OPENAI_API_KEY`: Required for AI-powered personalization features.
- `SUPABASE_DB_URL`: Database connection string used for direct PostgreSQL access during migrations.

The application validates these variables at runtime, throwing descriptive errors if they are missing. Client-side components use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` through the `createSupabaseBrowserClient` function, while server components use both public and service keys via `createSupabaseServerClient` depending on required permissions.

**Section sources**
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L6-L8)
- [lib/supabase/server.ts](file://lib/supabase/server.ts#L4-L7)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L4-L10)

## Framework Detection and Build Settings
Vercel automatically detects Next.js applications and configures the build process accordingly. For the persona application, the following build settings should be used:

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `pnpm build` - This runs the Next.js build process with the `--no-lint` flag as specified in package.json to skip linting during production builds.
- **Output Directory**: `.next` - The default output directory for Next.js builds containing static files and server bundles.
- **Install Command**: `pnpm install` - Uses pnpm package manager as indicated by the presence of `pnpm-lock.yaml`.
- **Node Version**: 20.x - Recommended for compatibility with Next.js 15.

The build process compiles React components, processes assets through Tailwind CSS, and generates static pages and server-side rendered routes. The `next.config.ts` file contains configuration to ignore TypeScript and ESLint build errors temporarily due to known compatibility issues between Supabase types and Next.js 15.

**Section sources**
- [package.json](file://package.json#L8-L9)
- [next.config.ts](file://next.config.ts#L3-L13)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L12-L18)

## vercel.json Configuration
The `vercel.json` configuration file specifies deployment settings for Vercel. Currently, it contains a minimal configuration that explicitly sets the framework preset:

```json
{
  "framework": "nextjs"
}
```

This configuration ensures Vercel correctly identifies the application as a Next.js project even if automatic detection fails. While not strictly necessary for Next.js applications (as Vercel auto-detects them), including this file provides explicit control over the deployment framework. The file can be extended to include additional routing rules, headers, redirects, or build overrides if needed in the future.

**Section sources**
- [vercel.json](file://vercel.json#L1-L4)

## Local Testing Instructions
Before deploying to production, it's essential to test the application locally using the same build process that Vercel will use. Follow these steps to verify the deployment configuration:

1. Install dependencies: `pnpm install`
2. Build the application: `pnpm build`
3. Start the production server: `pnpm start`

After running these commands, the application will be available at [http://localhost:3000](http://localhost:3000). This process validates that the build configuration works correctly and that all environment variables are properly set. The local test mimics Vercel's deployment pipeline, helping catch issues before they reach production. The `test/env/env.test.ts` file contains validation tests that verify environment variables are present and correctly formatted.

**Section sources**
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L28-L37)
- [package.json](file://package.json#L7-L9)

## Common Deployment Issues
Several common issues can occur during Vercel deployment. Understanding and addressing these proactively can prevent downtime and deployment failures.

### Missing Environment Variables
The most frequent deployment issue is missing environment variables. The application will fail to start if `NEXT_PUBLIC_SUPABASE_URL` or authentication keys are not set. Each environment variable must be configured for all deployment environments (Preview, Staging, Production) in the Vercel dashboard.

### Git Integration Problems
Ensure the Vercel project is correctly connected to the Git repository. Deployment triggers should be configured for the appropriate branches (typically main for production). Webhook delivery failures can prevent automatic deployments, so verify the integration status in Vercel's Git settings.

### Dependency Resolution with pnpm
The project uses pnpm as its package manager, indicated by the `pnpm-lock.yaml` file. Vercel must use pnpm rather than npm or yarn to install dependencies. Ensure `pnpm install` is specified as the install command and that `pnpm-lock.yaml` is committed to the repository. Version mismatches between local and Vercel's pnpm can cause dependency resolution issues, so keeping pnpm versions aligned is recommended.

**Section sources**
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L20-L26)
- [package.json](file://package.json#L69)
- [pnpm-lock.yaml](file://pnpm-lock.yaml)

## Deployment Verification
After deployment, verify success through multiple channels:

1. **Vercel Dashboard**: Check the deployment logs for any errors during the build and deployment process. A successful deployment will show a green status and provide the deployment URL.
2. **Application URL**: Access the assigned URL (e.g., `your-project.vercel.app`) and verify the application loads correctly.
3. **Functionality Testing**: Test core features including user authentication, data loading from Supabase, and API route functionality.
4. **API Routes**: Verify that API endpoints under `/api` are accessible and return expected responses.
5. **Environment Validation**: The application's environment validation tests can be run in the deployment context to confirm all variables are correctly set.

The Vercel dashboard provides real-time monitoring, analytics, and error tracking to help maintain application health post-deployment.

**Section sources**
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L28-L37)
- [README.md](file://README.md#L5-L10)

## Performance Considerations
Deploying on Vercel's serverless infrastructure requires attention to performance optimization, particularly for API routes and serverless functions.

### Serverless Function Optimization
Next.js API routes are deployed as serverless functions on Vercel. Keep these functions lightweight and avoid long-running operations. The application's API routes in the `app/api` directory should be designed for quick execution, with database queries optimized and external API calls minimized.

### Caching Strategies
Implement caching at multiple levels:
- **Browser Caching**: Leverage Next.js's built-in static site generation (SSG) and incremental static regeneration (ISR) for pages that don't require real-time data.
- **CDN Caching**: Vercel's global CDN automatically caches static assets. Configure cache headers for API routes that return infrequently changing data.
- **Supabase Query Caching**: Use Supabase's built-in caching for frequently accessed data, and consider implementing Redis or similar for complex query results.
- **Client-Side Caching**: Utilize React Query or similar libraries to cache data on the client side and reduce redundant API calls.

These strategies reduce latency, decrease database load, and improve overall user experience while controlling serverless function invocation costs.

**Section sources**
- [app/api](file://app/api)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [next.config.ts](file://next.config.ts)