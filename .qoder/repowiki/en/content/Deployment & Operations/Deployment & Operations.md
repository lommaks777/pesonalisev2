# Deployment & Operations

<cite>
**Referenced Files in This Document**   
- [vercel.json](file://vercel.json)
- [railway.json](file://railway.json)
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md)
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [msw/handlers.ts](file://msw/handlers.ts)
- [start_server.sh](file://start_server.sh)
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Vercel Deployment](#vercel-deployment)
3. [Railway Deployment](#railway-deployment)
4. [Platform Comparison](#platform-comparison)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup Procedures](#backup-procedures)
8. [Scaling and Performance Optimization](#scaling-and-performance-optimization)
9. [Health Check and Deployment Verification](#health-check-and-deployment-verification)
10. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive guidance for deploying and operating the persona application in production environments. It covers deployment procedures for both Vercel and Railway platforms, including configuration requirements, environment variables, and platform-specific considerations. The document also details post-deployment setup, monitoring strategies, backup procedures, scaling considerations, and verification processes to ensure system readiness.

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)

## Vercel Deployment
Deploying the persona application on Vercel requires specific configuration and environment variables. The platform automatically detects the Next.js framework, but custom build settings can be configured if needed.

### Configuration
The `vercel.json` file specifies the framework as Next.js:
```json
{
  "framework": "nextjs"
}
```

### Environment Variables
The following environment variables must be configured in the Vercel dashboard under **Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### Build Settings
Vercel uses the following build configuration:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x

### Local Testing
Before deployment, test the application locally:
```bash
pnpm install
pnpm build
pnpm start
```

**Section sources**
- [vercel.json](file://vercel.json#L0-L3)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L0-L10)

## Railway Deployment
Deploying on Railway requires a different configuration approach, as the application runs as a PHP server serving static files and handling API requests.

### Configuration
The `railway.json` file defines the deployment configuration:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "php -S 0.0.0.0:$PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

### Environment Variables
The following environment variables must be set in the Railway dashboard:
- `OPENAI_API_KEY`: API key for OpenAI services
- `KINESCOPE_API_KEY`: API key for Kinescope video processing

### Project Optimization
Before deployment, optimize the project size by:
- Removing video files (4.7 GB saved)
- Excluding large files via `.gitignore`
- Compressing audio files to 16kHz
- Removing temporary and duplicate files

### Deployment Process
1. Register at [railway.app](https://railway.app)
2. Create a new project using "Deploy from GitHub repo"
3. Select the persona repository
4. Railway automatically deploys the application
5. Configure environment variables in the Railway dashboard

**Section sources**
- [railway.json](file://railway.json#L0-L10)
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [start_server.sh](file://start_server.sh#L0-L60)

## Platform Comparison
When choosing between Vercel and Railway for deployment, consider the following factors:

### Cost
- **Vercel**: Offers a free tier with generous limits for static sites and serverless functions. Pro plans start at $20/month.
- **Railway**: Hobby plan costs $5/month with 512 MB RAM and 1 GB storage, suitable for the optimized persona application.

### Performance
- **Vercel**: Optimized for Next.js applications with global edge network for fast content delivery.
- **Railway**: Provides dedicated resources with consistent performance, suitable for PHP-based server applications.

### Storage Limitations
- **Vercel**: Limited storage for serverless functions; external storage recommended for large files.
- **Railway**: 1 GB storage on Hobby plan, sufficient for the optimized application after video file removal.

### Use Case Recommendations
- **Vercel**: Best for the Next.js frontend with serverless API routes and Supabase integration.
- **Railway**: Suitable for the PHP-based server implementation with file system access for course data.

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)

## Post-Deployment Setup
After successful deployment, several setup steps are required to prepare the application for production use.

### Database Migrations
Run database migrations using the provided script:
```bash
npx ts-node scripts/run-migrations.ts
```
This script connects to Supabase using the `SUPABASE_DB_URL` environment variable and applies all SQL migrations in the `migrations/` directory in sequential order.

### Lesson Data Import
Import lesson data and user profiles:
```bash
npx ts-node scripts/import-lessons.ts
```
This script:
1. Reads course data from `store/Массаж ШВЗ/course.json`
2. Imports lessons from the `lessons/` subdirectories
3. Creates or updates course and lesson records in Supabase
4. Imports user profiles from `user_profiles.json`
5. Imports personalized lesson descriptions

The import process uses the `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables for database access.

**Section sources**
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts#L0-L48)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts#L0-L264)

## Monitoring and Logging
Effective monitoring and logging are essential for maintaining application health and diagnosing issues.

### Log Files
The application generates the following log files in the `store/` directory:
- `processing_queue.json`: Processing queue status
- `processing_status.json`: Lesson processing statuses
- `user_profiles.json`: User profile data

### Monitoring Commands
Use these commands to monitor system status:
```bash
# View processing queue
php -r "require 'queue_system.php'; print_r(getProcessingQueue());"

# View queue statistics
php -r "require 'queue_system.php'; print_r(getQueueStats());"
```

### Error Handling
The system implements both automatic and manual error handling:
- **Automatic fixes**: Retry downloads on network errors, compress audio for Whisper limits, split long audio files, validate JSON
- **Manual fixes**: Verify API keys in configuration, install FFmpeg, set proper file permissions, check internet connectivity

**Section sources**
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L135-L163)
- [start_server.sh](file://start_server.sh#L0-L60)

## Backup Procedures
Regular backups are critical for data protection and disaster recovery.

### Data Backup Strategy
Backup the entire `store/` directory, which contains:
- Course content (JSON files, audio, transcripts)
- User profiles and personalization data
- Processing logs and status files

### Backup Frequency
- **Daily backups**: For production environments with active users
- **Weekly backups**: For development and staging environments
- **Pre-deployment backups**: Before any major deployment or migration

### Backup Storage
Store backups in a separate location from the application, such as:
- Cloud storage (AWS S3, Google Cloud Storage)
- External hard drives
- Version control systems (for configuration files)

**Section sources**
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L135-L163)
- [store/](file://store/)

## Scaling and Performance Optimization
As traffic increases, implement scaling strategies to maintain performance.

### Horizontal Scaling
- **Vercel**: Automatically scales serverless functions based on demand
- **Railway**: Upgrade to higher-tier plans with more RAM and CPU resources

### Caching Strategies
- Implement browser caching for static assets
- Use CDN for media files
- Cache API responses where appropriate

### Database Optimization
- Ensure proper indexing on frequently queried fields
- Monitor query performance
- Use connection pooling

### Traffic Management
For high-traffic scenarios:
- Implement rate limiting
- Use load balancing
- Monitor resource utilization
- Set up auto-scaling where supported

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)

## Health Check and Deployment Verification
Verify deployment success and monitor system health using built-in endpoints.

### Health Check Endpoint
The application provides a health check endpoint at `/api/health`:
```typescript
http.get("/api/health", () => {
  return HttpResponse.json({ status: "ok" });
});
```
This endpoint returns a 200 status with `{ "status": "ok" }` when the application is running correctly.

### Deployment Verification Process
1. **Check deployment status** in the platform dashboard
2. **Access the health check endpoint** to verify application responsiveness
3. **Test core functionality** by accessing key pages
4. **Verify environment variables** are correctly configured
5. **Confirm database connectivity** by checking for successful queries
6. **Test API endpoints** to ensure they return expected responses

### Verification Checklist
- [ ] Application responds to HTTP requests
- [ ] Health check endpoint returns 200 OK
- [ ] Environment variables are accessible
- [ ] Database connection is established
- [ ] Static assets are served correctly
- [ ] API routes are functional

**Section sources**
- [msw/handlers.ts](file://msw/handlers.ts#L0-L6)
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L135-L163)

## Conclusion
Deploying and operating the persona application in production requires careful consideration of platform options, configuration requirements, and operational procedures. Vercel offers an optimized environment for the Next.js frontend with serverless functions, while Railway provides a flexible platform for the PHP-based server implementation. Both platforms require proper environment variable configuration and benefit from the application's optimized structure. Post-deployment setup, including database migrations and data import, is essential for system readiness. Ongoing monitoring, logging, backup procedures, and scaling strategies ensure reliable operation as traffic grows. The health check endpoint and verification process provide confidence in deployment success and system stability.