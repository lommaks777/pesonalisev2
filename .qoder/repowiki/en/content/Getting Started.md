# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [.env.example](file://.env.example)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/openai.ts](file://lib/openai.ts)
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts)
- [migrations/001_init.sql](file://migrations/001_init.sql)
- [start_server.sh](file://start_server.sh)
- [test/env/env.test.ts](file://test/env/env.test.ts)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Cloning the Repository](#cloning-the-repository)
3. [Installing Dependencies](#installing-dependencies)
4. [Setting Up Environment Variables](#setting-up-environment-variables)
5. [Running the Application Locally](#running-the-application-locally)
6. [Running Tests](#running-tests)
7. [Executing Database Migrations](#executing-database-migrations)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Making API Requests](#making-api-requests)
10. [Configuration Files](#configuration-files)

## Prerequisites

Before setting up the project, ensure your development environment meets the following requirements:

- **Node.js**: Version 18 or higher (LTS recommended)
- **pnpm**: Package manager (install via `npm install -g pnpm`)
- **Supabase Account**: Access to a Supabase project for database and authentication services
- **OpenAI API Key**: Valid API key for AI-powered personalization features
- **Git**: Installed and configured for repository cloning

These tools are essential for running the application, executing migrations, and enabling AI functionality.

**Section sources**
- [package.json](file://package.json#L0-L69)
- [README.md](file://README.md#L0-L36)

## Cloning the Repository

To begin, clone the repository to your local machine using Git:

```bash
git clone https://github.com/your-organization/persona.git
cd persona
```

Replace `your-organization` with the actual GitHub organization or username hosting the repository. This creates a local copy of the project with the full directory structure.

## Installing Dependencies

After cloning, install all required dependencies using pnpm:

```bash
pnpm install
```

This command reads the `package.json` file and installs all listed dependencies, including Next.js, Supabase client libraries, OpenAI SDK, and development tools like Vitest and Playwright. The installation process also sets up TypeScript, ESLint, and Prettier for code quality assurance.

**Section sources**
- [package.json](file://package.json#L0-L69)

## Setting Up Environment Variables

The application requires several environment variables to function correctly. Start by copying the example configuration:

```bash
cp .env.example .env.local
```

Then, edit the `.env.local` file with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=your-openai-api-key

# Database (Optional - for migrations)
SUPABASE_DB_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Course Data Path
COURSE_STORE_PATH=store/shvz
```

### Required Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Public URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous key for client-side database access
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side privileged operations
- `OPENAI_API_KEY`: API key for OpenAI services
- `SUPABASE_DB_URL`: Full PostgreSQL connection string for direct database access
- `COURSE_STORE_PATH`: Relative path to the directory containing course data (e.g., `store/shvz`)

The `SUPABASE_SERVICE_ROLE_KEY` provides full database access and should never be exposed client-side. The `COURSE_STORE_PATH` must point to an existing directory containing course JSON files and lesson data.

**Section sources**
- [.env.example](file://.env.example#L0-L9)
- [lib/supabase/server.ts](file://lib/supabase/server.ts#L0-L27)
- [lib/openai.ts](file://lib/openai.ts#L0-L7)
- [test/env/env.test.ts](file://test/env/env.test.ts#L35-L66)

## Running the Application Locally

Once dependencies are installed and environment variables are configured, start the development server:

```bash
pnpm dev
```

This command launches the Next.js development server. The application will be available at [http://localhost:3000](http://localhost:3000). The development server supports hot reloading, meaning changes to code files will automatically refresh the browser.

Alternatively, you can use the provided shell script:

```bash
./start_server.sh
```

This script sets up the environment and starts the development server with proper configuration.

**Section sources**
- [package.json](file://package.json#L0-L69)
- [start_server.sh](file://start_server.sh)

## Running Tests

The project includes unit and integration tests using Vitest and Playwright. Run the test suite with:

```bash
pnpm test
```

To run tests in watch mode during development:

```bash
pnpm test:watch
```

For end-to-end testing:

```bash
pnpm e2e
```

The test suite includes environment validation tests that verify all required environment variables are correctly set and formatted, helping catch configuration issues early.

**Section sources**
- [package.json](file://package.json#L0-L69)
- [test/env/env.test.ts](file://test/env/env.test.ts#L0-L66)

## Executing Database Migrations

Database schema changes are managed through SQL migration files in the `migrations/` directory. To apply migrations:

```bash
pnpm db:migrate
```

This command executes all SQL files in the `migrations/` directory in alphabetical order. The current schema (`001_init.sql`) includes tables for courses, lessons, profiles, and personalized content with proper relationships and constraints.

To seed the database with initial course data:

```bash
pnpm db:seed
```

This imports lesson content and user profiles from the course store directory into the database.

**Section sources**
- [package.json](file://package.json#L0-L69)
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts#L0-L48)
- [scripts/import-lessons.ts](file://scripts/import-lessons.ts#L0-L264)
- [migrations/001_init.sql](file://migrations/001_init.sql#L0-L88)

## Troubleshooting Common Issues

### Missing Environment Variables
If the application fails to start, verify all required environment variables are set:
- Check that `.env.local` exists and contains all required keys
- Ensure `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are not empty
- Validate that `COURSE_STORE_PATH` points to an existing directory

### Database Connection Errors
For migration or seeding failures:
- Confirm `SUPABASE_DB_URL` is correctly formatted and accessible
- Verify network connectivity to the Supabase database
- Ensure the service role key has sufficient privileges

### Dependency Installation Issues
If `pnpm install` fails:
- Ensure pnpm is installed globally (`npm install -g pnpm`)
- Clear the pnpm store if corrupted (`pnpm store prune`)
- Try reinstalling with `pnpm install --force`

### API Key Validation
The test suite validates OpenAI API key format. If tests fail:
- Ensure your OpenAI key starts with `sk-`
- Verify the key has sufficient permissions
- Regenerate the key in the OpenAI dashboard if invalid

**Section sources**
- [test/env/env.test.ts](file://test/env/env.test.ts#L0-L66)
- [lib/supabase/server.ts](file://lib/supabase/server.ts#L0-L27)
- [scripts/run-migrations.ts](file://scripts/run-migrations.ts#L0-L48)

## Making API Requests

After starting the server, you can test API endpoints. For example, to retrieve lessons:

```bash
curl http://localhost:3000/api/lessons
```

This returns a JSON response containing lesson data. The API routes are located in the `app/api/` directory and follow Next.js App Router conventions. Protected routes use Supabase authentication, while public routes provide lesson content and survey functionality.

**Section sources**
- [app/api/lessons/route.ts](file://app/api/lessons/route.ts)

## Configuration Files

Key configuration files control application behavior:

- `package.json`: Defines scripts, dependencies, and project metadata
- `next.config.ts`: Configures Next.js build and routing behavior
- `tsconfig.json`: TypeScript compiler settings
- `.env.local`: Environment-specific configuration (not versioned)
- `vitest.config.ts`: Test runner configuration
- `playwright.config.ts`: End-to-end testing configuration

These files should not be modified without understanding their impact on the application's behavior and deployment.

**Section sources**
- [package.json](file://package.json#L0-L69)
- [next.config.ts](file://next.config.ts)
- [tsconfig.json](file://tsconfig.json)
- [vitest.config.ts](file://vitest.config.ts)
- [playwright.config.ts](file://playwright.config.ts)