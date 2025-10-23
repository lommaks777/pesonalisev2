# Deployment & Operations

<cite>
**Referenced Files in This Document**   
- [vercel.json](file://vercel.json) - *Updated in recent commit*
- [railway.json](file://railway.json) - *Updated in recent commit*
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md)
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [msw/handlers.ts](file://msw/handlers.ts)
- [start_server.sh](file://start_server.sh)
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md) - *Added in recent commit*
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts) - *Created in recent commit*
- [app/api/survey/route.ts](file://app/api/survey/route.ts) - *Modified in recent commit*
- [scripts/update-user-personalizations.ts](file://scripts/update-user-personalizations.ts) - *Updated in recent commit*
</cite>

## Update Summary
**Changes Made**   
- Updated documentation to reflect the new transcript-based personalization engine
- Added detailed phased rollout plan for the personalization engine refactoring
- Updated post-deployment setup with new migration and personalization scripts
- Enhanced monitoring and rollback procedures for the new system
- Added cost analysis and performance metrics for the new personalization approach
- Updated environment variable requirements and verification procedures

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
This document provides comprehensive guidance for deploying and operating the persona application in production environments. It covers deployment procedures for both Vercel and Railway platforms, including configuration requirements, environment variables, and platform-specific considerations. The document also details post-deployment setup, monitoring strategies, backup procedures, scaling considerations, and verification processes to ensure system readiness. Special attention is given to the new transcript-based personalization engine and its deployment requirements.

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)

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
- `OPENAI_API_KEY`: API key for OpenAI services (required for personalization engine)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for administrative operations (required for scripts)

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
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for administrative operations

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

### Personalization Engine Deployment
The new transcript-based personalization engine requires a phased rollout:

#### Phase 1: Silent Launch
**Objective**: New system active for new submissions only
- Deploy code to production
- New survey submissions use new engine automatically
- Existing user personalizations unchanged
- Monitor error logs for 24-48 hours
- Verify new personalizations stored correctly
- Check API response times (acceptable: <60s for full survey)

**Success Criteria**:
- Zero errors in production logs
- All new survey submissions complete successfully
- Quality spot-check: 3-5 new personalizations reviewed

#### Phase 2: Test User Migration
**Objective**: Validate new engine with existing user data
**Script**: `scripts/update-user-personalizations.ts` (updated)
```bash
# Example usage
npx tsx --env-file=.env.local scripts/update-user-personalizations.ts 21179358
```

**Validation Steps**:
1. Run script for test user
2. Verify all 12 lessons regenerated
3. Review quality of generated content
4. Compare with old personalizations (manual review)
5. Collect feedback from test user (if possible)

**Success Criteria**:
- 100% regeneration success rate
- Quality equal or better than old system
- No errors during generation
- Database integrity maintained

#### Phase 3: Gradual Rollout
**Objective**: Migrate all existing users
**Options**:
**Option A: Batch Migration** (Recommended)
```bash
# Migrate users in batches of 10
for userId in $(cat user_list.txt | head -10); do
  npx tsx --env-file=.env.local scripts/update-user-personalizations.ts $userId
  sleep 30  # Rate limiting
done
```

**Option B: On-Demand Migration**
- Wait for users to re-submit survey
- New personalizations generated automatically
- Gradual, natural migration over time

**Recommended**: Option A for active users, Option B for inactive

**Timeline**:
- Week 1: Migrate top 10% active users
- Week 2: Migrate next 30% active users
- Week 3: Migrate remaining active users
- Ongoing: On-demand for inactive users

#### Phase 4: Template Archive
**Objective**: Clean up deprecated files
```bash
# Create archive directory
mkdir -p store/shvz/_archived_templates

# Move template JSON files
mv store/shvz/*-final.json store/shvz/_archived_templates/
mv store/shvz/*-final-backup.json store/shvz/_archived_templates/

# Keep transcripts and other essential files
# Do NOT move *.txt files (these are still used)
```

**Success Criteria**:
- Template files archived but preserved
- No file system dependencies in active code
- Documentation updated

**Section sources**
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts#L0-L48)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts#L0-L264)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L0-L371)
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170)
- [scripts/update-user-personalizations.ts](file://scripts/update-user-personalizations.ts#L0-L233)

## Monitoring and Logging
Effective monitoring and logging are essential for maintaining application health and diagnosing issues.

### Technical Metrics to Track
**Performance**:
- Average generation time per lesson
- API timeout rate
- Success/failure rate
- Retry usage frequency

**Cost**:
- OpenAI API usage (tokens)
- Daily API costs
- Cost per student
- Compare to projected $0.84/student

**Quality**:
- Manual review of 10 random personalizations/day
- Quality score tracking
- Field population rate

### Business Metrics to Track
**Engagement** (measure after 30 days):
- Lesson view rate (target: +20%)
- Time to first lesson view (target: -20%)
- Course completion rate (target: +15%)
- Student satisfaction (target: ≥4.5/5)

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
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)

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
- Consider Redis caching for transcripts (future optimization)

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

### Performance Considerations for Personalization Engine
The new personalization engine has different performance characteristics:
- **Processing Time**: 25-35 seconds per lesson (vs 3-5 seconds previously)
- **AI Model**: GPT-4o (vs GPT-4o-mini previously)
- **Context Size**: 15-30KB (vs 1-2KB previously)
- **Cost per Lesson**: ~$0.015-0.020 (vs ~$0.005 previously)
- **Cost per Student**: ~$0.84 (vs ~$0.06 previously)

**Mitigation Strategies**:
- Implement async/queue-based processing (future)
- Consider transcript truncation (keep first 15,000 chars)
- Add progress indicators for users
- Batch operations for existing user migrations

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)

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
- [ ] Personalization engine generates content from transcripts
- [ ] New personalization structure (7 sections) is correctly implemented

### Rollback Plan
**Trigger Conditions**: Rollback if any of:
- Error rate >5% for new personalizations
- Quality degradation confirmed
- Costs exceed 2x projection
- Critical bugs discovered

**Rollback Procedure**:
1. **Immediate Mitigation**:
```typescript
// In app/api/survey/route.ts
// Comment out new engine, uncomment old:

// OLD (rollback to this):
// const template = await loadLessonTemplate(lesson.lesson_number);
// const personalization = await personalizeLesson(template, survey, userName, lessonInfo);

// NEW (currently active):
const transcriptData = await loadLessonTranscript(lesson.id);
const personalization = await generatePersonalizedDescription(...);
```

2. **Redeploy**:
```bash
git revert <commit-hash>  # Revert to last stable version
vercel deploy --prod
```

3. **Communicate**:
- Notify team of rollback
- Document root cause
- Plan fix

**Recovery Time**: <15 minutes

**Section sources**
- [msw/handlers.ts](file://msw/handlers.ts#L0-L6)
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L135-L163)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)

## Conclusion
Deploying and operating the persona application in production requires careful consideration of platform options, configuration requirements, and operational procedures. Vercel offers an optimized environment for the Next.js frontend with serverless functions, while Railway provides a flexible platform for the PHP-based server implementation. Both platforms require proper environment variable configuration and benefit from the application's optimized structure.

The new transcript-based personalization engine represents a fundamental architectural improvement that eliminates the information bottleneck in the previous template-based system. By processing full lesson transcripts directly with GPT-4o, the new system generates significantly richer, more deeply personalized content that demonstrates concrete value to students. The increased cost per student ($0.78) is a strategic investment in content quality that should yield returns through improved retention.

Post-deployment setup, including database migrations and data import, is essential for system readiness. Ongoing monitoring, logging, backup procedures, and scaling strategies ensure reliable operation as traffic grows. The health check endpoint and verification process provide confidence in deployment success and system stability. The phased rollout plan and rollback procedures ensure a safe transition to the new personalization system.

**Section sources**
- [RAILWAY_DEPLOYMENT_FINAL.md](file://RAILWAY_DEPLOYMENT_FINAL.md#L0-L152)
- [VERCEL_DEPLOY.md](file://VERCEL_DEPLOY.md#L0-L37)
- [DEPLOYMENT_CHECKLIST.md](file://DEPLOYMENT_CHECKLIST.md#L0-L292)