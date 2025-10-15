# Technology Stack

<cite>
**Referenced Files in This Document**   
- [package.json](file://package.json)
- [next.config.ts](file://next.config.ts)
- [tsconfig.json](file://tsconfig.json)
- [postcss.config.mjs](file://postcss.config.mjs)
- [client.ts](file://lib/supabase/client.ts)
- [server.ts](file://lib/supabase/server.ts)
- [openai.ts](file://lib/openai.ts)
- [vitest.config.ts](file://vitest.config.ts)
- [playwright.config.ts](file://playwright.config.ts)
- [handlers.ts](file://msw/handlers.ts)
</cite>

## Table of Contents
1. [Core Frameworks](#core-frameworks)
2. [Supporting Libraries](#supporting-libraries)
3. [Version Constraints and Compatibility](#version-constraints-and-compatibility)
4. [Performance Characteristics](#performance-characteristics)
5. [Rationale for Technology Decisions](#rationale-for-technology-decisions)
6. [Custom Configurations](#custom-configurations)
7. [Official Documentation Links](#official-documentation-links)

## Core Frameworks

### Next.js 15 with App Router
The application leverages **Next.js 15** with the **App Router** architecture for server-side rendering (SSR), dynamic routing, and optimized performance. This enables full-stack capabilities with React Server Components, streaming, and improved data fetching patterns. The App Router provides a file-based routing system under the `app/` directory, supporting layouts, templates, and nested routing for complex UI structures.

The configuration in `next.config.ts` includes temporary workarounds for type compatibility issues between Next.js 15 and Supabase, specifically ignoring TypeScript build errors and ESLint warnings during compilation to ensure smooth development and deployment cycles.

**Section sources**
- [next.config.ts](file://next.config.ts#L1-L15)
- [package.json](file://package.json#L25-L26)

### React 19
Built on **React 19.1.0**, the application utilizes the latest React features including Actions, improved Server Component support, and enhanced performance optimizations. React 19 enables seamless integration with Next.js 15’s App Router, allowing for efficient rendering strategies and better resource management.

**Section sources**
- [package.json](file://package.json#L27-L28)

### TypeScript
**TypeScript** is used throughout the codebase to enforce type safety, improve developer experience, and reduce runtime errors. The `tsconfig.json` file configures strict type checking, ES2017 target, module resolution for bundlers, and path aliases (`@/*`) for cleaner imports. The configuration supports modern JSX syntax and incremental compilation for faster builds.

**Section sources**
- [tsconfig.json](file://tsconfig.json#L1-L27)

### Tailwind CSS
**Tailwind CSS** is the primary styling solution, integrated via PostCSS with the `@tailwindcss/postcss` plugin. It enables utility-first styling with responsive design, dark mode support (via `next-themes`), and efficient class composition. The setup allows for rapid UI development with minimal custom CSS.

**Section sources**
- [postcss.config.mjs](file://postcss.config.mjs#L1-L5)
- [package.json](file://package.json#L30-L31)

### Supabase
**Supabase** serves as the backend-as-a-service platform, providing a PostgreSQL database, authentication, and real-time capabilities. The project implements both client-side and server-side Supabase clients:
- `createSupabaseBrowserClient()` for client-side operations using public environment variables
- `createSupabaseServerClient()` for secure server-side access using a service role key

This dual-client pattern ensures secure data access while enabling full-stack functionality within Next.js route handlers.

**Section sources**
- [client.ts](file://lib/supabase/client.ts#L3-L8)
- [server.ts](file://lib/supabase/server.ts#L19-L25)
- [package.json](file://package.json#L23-L24)

## Supporting Libraries

### Zod for Validation
**Zod** is used for runtime type checking and schema validation across API routes and forms. It ensures data integrity when processing user inputs, API payloads, and database interactions.

**Section sources**
- [package.json](file://package.json#L32-L33)

### OpenAI SDK
The **OpenAI SDK** (`openai` package) is integrated for AI-powered content generation, particularly in personalizing lesson templates based on user profiles. A shared `openai` instance is initialized in `lib/openai.ts` using the `OPENAI_API_KEY` environment variable, and reused across API routes and scripts.

**Section sources**
- [openai.ts](file://lib/openai.ts#L2-L2)
- [package.json](file://package.json#L29-L30)

### Testing Stack
#### Vitest
**Vitest** is the primary unit testing framework, configured with JSDOM for browser-like environment simulation. It supports React testing via `@testing-library/react`, runs tests in watch mode, and generates JUnit reports in CI environments.

**Section sources**
- [vitest.config.ts](file://vitest.config.ts#L1-L27)
- [package.json](file://package.json#L45-L48)

#### Playwright
**Playwright** handles end-to-end (E2E) testing, running tests in Chromium with video and trace recording on failure. The configuration launches the dev server automatically and supports CI/CD reporting via HTML reports.

**Section sources**
- [playwright.config.ts](file://playwright.config.ts#L1-L27)
- [package.json](file://package.json#L49-L51)

### MSW for API Mocking
**Mock Service Worker (MSW)** is used to intercept HTTP requests during testing and development. The `handlers.ts` file defines mock responses for health checks and other endpoints, enabling isolated frontend development without backend dependencies.

**Section sources**
- [handlers.ts](file://msw/handlers.ts#L3-L6)
- [package.json](file://package.json#L44-L45)

## Version Constraints and Compatibility

The project uses specific versions to ensure compatibility:
- **Next.js 15.5.4** with matching `eslint-config-next`
- **React 19.1.0** and **React DOM 19.1.0**
- **TypeScript ^5** with corresponding `@types/react` and `@types/react-dom`
- **Tailwind CSS ^4** with PostCSS integration
- **Supabase JS client ^2.75.0** and SSR utilities ^0.7.0
- **OpenAI SDK ^6.2.0**

Temporary type checking suppression in `next.config.ts` addresses known incompatibilities between Supabase types and Next.js 15, indicating an ongoing need for upstream fixes or custom type overrides.

**Section sources**
- [package.json](file://package.json#L1-L70)
- [next.config.ts](file://next.config.ts#L3-L7)

## Performance Characteristics

The chosen stack delivers strong performance:
- **Next.js 15 App Router** enables SSR, streaming, and partial hydration for fast initial loads
- **React 19** improves rendering efficiency and reduces bundle sizes
- **Tailwind CSS** purges unused styles in production, minimizing CSS payloads
- **Supabase** provides low-latency database access with connection pooling
- **OpenAI integration** is abstracted into API routes to prevent blocking the main thread
- **Vitest and Playwright** enable fast, parallel test execution

The use of server-side Supabase clients with `persistSession: false` optimizes serverless function performance by avoiding session persistence overhead.

**Section sources**
- [server.ts](file://lib/supabase/server.ts#L21-L24)
- [next.config.ts](file://next.config.ts#L3-L7)

## Rationale for Technology Decisions

| Technology | Rationale |
|----------|---------|
| **Next.js 15 App Router** | Enables modern full-stack React development with SSR, streaming, and simplified data fetching |
| **React 19** | Leverages latest React features for better performance and developer experience |
| **TypeScript** | Ensures type safety across frontend, backend, and database layers |
| **Tailwind CSS** | Accelerates UI development with utility-first approach and responsive design |
| **Supabase** | Provides PostgreSQL database, auth, and real-time features with minimal backend code |
| **Zod** | Offers reliable runtime validation with excellent TypeScript integration |
| **OpenAI SDK** | Simplifies AI content generation for personalized learning experiences |
| **Vitest & Playwright** | Comprehensive testing coverage from unit to E2E levels |
| **MSW** | Enables robust API mocking for development and testing isolation |

## Custom Configurations

The project includes several non-default configurations:
- **TypeScript**: Custom path mapping `@/*` to root directory
- **Next.js**: Build error and linting suppression due to Supabase/Next.js 15 type conflicts
- **Vitest**: JSDOM environment with React testing library and JSX automatic transform
- **Playwright**: Custom web server command and CI-specific reporter settings
- **MSW**: Browser and server handlers for request interception

These configurations balance innovation with stability, allowing adoption of cutting-edge features while managing ecosystem limitations.

**Section sources**
- [tsconfig.json](file://tsconfig.json#L20-L21)
- [next.config.ts](file://next.config.ts#L3-L7)
- [vitest.config.ts](file://vitest.config.ts#L1-L27)
- [playwright.config.ts](file://playwright.config.ts#L1-L27)
- [handlers.ts](file://msw/handlers.ts#L1-L11)

## Official Documentation Links

- **Next.js**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **React**: [https://react.dev](https://react.dev)
- **TypeScript**: [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Zod**: [https://zod.dev](https://zod.dev)
- **OpenAI SDK**: [https://github.com/openai/openai-node](https://github.com/openai/openai-node)
- **Vitest**: [https://vitest.dev](https://vitest.dev)
- **Playwright**: [https://playwright.dev](https://playwright.dev)
- **MSW**: [https://mswjs.io](https://mswjs.io)