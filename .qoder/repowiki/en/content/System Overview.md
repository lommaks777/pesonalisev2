# System Overview

<cite>
**Referenced Files in This Document**   
- [app/api/survey/route.ts](file://app/api/survey/route.ts) - *Updated in recent commit*
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts) - *New implementation*
- [lib/services/openai.ts](file://lib/services/openai.ts) - *Deprecated in recent commit*
- [lib/services/lesson-templates.ts](file://lib/services/lesson-templates.ts) - *Deprecated in recent commit*
- [scripts/migrate-transcripts-to-db.ts](file://scripts/migrate-transcripts-to-db.ts) - *New implementation*
- [PERSONALIZATION_ENGINE_REFACTORING_SUMMARY.md](file://PERSONALIZATION_ENGINE_REFACTORING_SUMMARY.md)
- [REFACTORING_COMPLETE.md](file://REFACTORING_COMPLETE.md)
- [COMPLETE_SYSTEM.md](file://COMPLETE_SYSTEM.md)
</cite>

## Update Summary
**Changes Made**   
- Completely refactored **Personalization Engine and JSON Templates** section to reflect transcript-driven architecture
- Updated **System Flow: From Survey to Personalized Lessons** to describe new transcript-based workflow
- Revised **Core Architecture Components** to remove template-based references and add transcript processing
- Added **Transcript Migration and Database Integration** section to document new data flow
- Updated **Technical Decisions** to reflect GPT-4o upgrade and database-centric approach
- Added new sources for personalization-engine.ts and migration scripts
- Removed outdated references to lesson-templates.ts and template-based personalization

## Table of Contents
1. [Introduction](#introduction)
2. [Business Goals and Target Users](#business-goals-and-target-users)
3. [Core Architecture Components](#core-architecture-components)
4. [Transcript Migration and Database Integration](#transcript-migration-and-database-integration)
5. [System Flow: From Survey to Personalized Lessons](#system-flow-from-survey-to-personalized-lessons)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [API Endpoints and Integration Points](#api-endpoints-and-integration-points)
9. [Personalization Engine and Transcript Processing](#personalization-engine-and-transcript-processing)
10. [External Integrations](#external-integrations)
11. [Fallback Mechanisms](#fallback-mechanisms)
12. [Technical Decisions](#technical-decisions)

## Introduction

The Persona application is an AI-powered personalized education platform designed specifically for massage therapy students. This system transforms standardized educational content into highly personalized learning experiences by leveraging user profiles, comprehensive surveys, and AI-driven content generation. The platform's primary purpose is to enhance learning effectiveness by tailoring educational materials to individual student needs, goals, and preferences.

The system architecture integrates multiple technologies and services to create a seamless flow from user onboarding through personalized lesson delivery. At its core, the application uses Next.js App Router with React Server Components to deliver a dynamic, server-rendered user interface that efficiently handles both static content and real-time personalization. User interactions begin with a comprehensive survey that captures critical information about the student's background, motivations, target clients, desired skills, fears, expected outcomes, and preferred practice models.

This information is then processed through an AI-powered personalization engine that generates customized lesson content for each student. The system has been fundamentally refactored to process full lesson transcripts directly rather than compressed templates, enabling richer, more contextually accurate personalization. The platform integrates with Supabase for data persistence, OpenAI for AI content generation, and external Learning Management Systems (LMS) like GetCourse for user acquisition and course delivery. The architecture is designed to be scalable, with clear separation of concerns between frontend presentation, API routes, database operations, and external service integrations.

The platform serves multiple stakeholders: students receive personalized educational content that directly addresses their specific needs and concerns; administrators can monitor user engagement and system performance; and developers benefit from a well-structured codebase with clear API contracts and modular components. This documentation provides a comprehensive overview of the system architecture, explaining how these components work together to deliver a personalized learning experience.

**Section sources**
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L0-L202)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)

## Business Goals and Target Users

The Persona application serves three primary user groups, each with distinct needs and goals. For massage therapy students (the primary users), the system aims to increase engagement and learning effectiveness by delivering content that directly addresses their personal motivations, skill levels, and professional aspirations. Students benefit from personalized lesson introductions, tailored practical tips, customized homework assignments, and motivational content that speaks directly to their individual goals and concerns. The platform specifically addresses common student anxieties such as fear of incorrect technique, lack of confidence, and concerns about finding clients, providing targeted reassurance and guidance.

For administrators and course creators, the business goals include increased student retention, higher course completion rates, and improved student outcomes. By personalizing the learning experience, the platform helps students feel more connected to the material and more confident in their progress, leading to greater satisfaction and reduced dropout rates. The system also provides valuable analytics on student profiles and engagement patterns, enabling course creators to refine their content and teaching approaches based on real user data.

Developers and technical stakeholders benefit from a modern, well-architected application built with Next.js App Router and React Server Components. The system demonstrates best practices in full-stack development with TypeScript, proper separation of concerns, and clean API design. The architecture supports easy maintenance and extension, with modular components and clear integration points. The use of Supabase as a backend-as-a-service solution reduces operational overhead while providing robust data management capabilities, and the integration with OpenAI showcases practical applications of generative AI in education technology.

The platform's integration with external LMS platforms like GetCourse extends its reach and utility, allowing seamless user acquisition and course delivery within existing educational ecosystems. This integration enables a smooth user journey from course enrollment on GetCourse to personalized content consumption on the Persona platform, creating a cohesive learning experience that bridges multiple systems. The business model leverages this integration to position the Persona application as a value-added service that enhances existing courses with AI-powered personalization features.

**Section sources**
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md#L0-L202)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)
- [store/user_profiles.json](file://store/user_profiles.json#L0-L269)

## Core Architecture Components

The Persona application's architecture consists of several interconnected components that work together to deliver personalized educational content. The frontend layer is built with Next.js App Router and React Server Components, providing a modern, server-rendered user interface with optimized performance and SEO capabilities. The UI components are organized into a modular structure with dedicated directories for personalizations, profiles, and shared UI elements, promoting reusability and maintainability.

The API layer exposes several critical endpoints that handle different aspects of the personalization workflow. The `/api/survey` endpoint processes user survey submissions, creating or updating user profiles in the database and triggering the personalization process for all course lessons. The `/api/persona/personalize-template` endpoint has been deprecated in favor of direct transcript processing. The `/api/persona/block` endpoint delivers pre-rendered HTML blocks containing personalized lesson descriptions for integration into external platforms.

The data layer is powered by Supabase, which provides a PostgreSQL database with a well-defined schema for storing user profiles, lessons, courses, and personalized lesson descriptions. The `profiles` table stores user information including names, identifiers, course enrollments, and survey responses, while the `personalized_lesson_descriptions` table contains the AI-generated personalized content for each user-lesson combination. The system now stores full lesson transcripts in the `lessons.content.transcription` JSONB field, eliminating the dependency on file-based templates.

The AI processing layer leverages OpenAI's GPT-4o model to generate personalized content based on full lesson transcripts and user profiles. This represents a significant upgrade from the previous GPT-4o-mini model and enables processing of complete lesson context (15-30KB) rather than compressed templates (1-2KB). The system includes error handling and fallback mechanisms to ensure reliability even when AI processing encounters issues.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L0-L139)
- [components/profiles/profile-survey.tsx](file://components/profiles/profile-survey.tsx#L0-L66)
- [components/personalizations/personalized-lesson.tsx](file://components/personalizations/personalized-lesson.tsx#L0-L26)

## Transcript Migration and Database Integration

The system has undergone a fundamental architectural transformation by migrating from a template-based personalization system to a transcript-driven approach. This change eliminates the information bottleneck of the previous system and enables richer, more contextually accurate personalization.

The migration process was executed through the `scripts/migrate-transcripts-to-db.ts` script, which transferred 12 lesson transcripts from file system storage to the Supabase database. All transcripts are now stored in the `lessons.content.transcription` JSONB field with associated metadata including transcription length, source, and date. The migration was completed with 100% success rate, and the original transcript files have been preserved for historical reference.

The database schema now includes a comprehensive content structure:
```json
{
  "transcription": "Full lesson transcript text...",
  "transcription_length": 15249,
  "transcription_source": "file-migration",
  "transcription_date": "2025-10-16T..."
}
```

This database-centric approach provides several advantages over the previous file-based template system:
- **Eliminated Information Loss**: Full transcripts (15-30KB) are processed instead of compressed templates (1-2KB)
- **Improved Maintainability**: Centralized data storage in database rather than distributed file system
- **Enhanced Scalability**: Database queries and transactions provide better performance at scale
- **Simplified Deployment**: No dependency on file system synchronization across environments

The `loadLessonTranscript` function in `lib/services/personalization-engine.ts` handles transcript retrieval from the database, with comprehensive error handling for missing or empty transcripts.

**Section sources**
- [scripts/migrate-transcripts-to-db.ts](file://scripts/migrate-transcripts-to-db.ts#L0-L317) - *New implementation*
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L63-L93) - *New implementation*
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L0-L139)

## System Flow: From Survey to Personalized Lessons

The system flow begins when a student accesses the survey form, typically through an iframe embedded in an external LMS like GetCourse. The student completes the survey, providing information about their name, motivation, target clients, desired skills, fears, expected results, and practice model. Upon submission, the frontend sends this data to the `/api/survey` endpoint, initiating the personalization workflow.

The API processes the survey data in several sequential steps. First, it validates the required fields and creates or updates a user profile in the Supabase database. If the student has a user identifier from GetCourse, this is used to link their profile across systems; otherwise, a guest identifier is generated. The profile stores all survey responses as JSON data, preserving the student's input for future personalization.

Next, the system retrieves all lessons for the enrolled course from the database. For each lesson, it loads the full transcript from the `lessons.content.transcription` field rather than a template file. The system then uses the OpenAI GPT-4o model to generate personalized content by combining the complete lesson transcript with the student's profile information.

The personalization process involves sending a carefully crafted prompt to the GPT-4o model, instructing it to adapt the lesson content based on the student's specific characteristics. The prompt includes the full transcript (15-30KB), the student's survey responses, and specific instructions to address the student by name, consider their motivations and goals, address their fears and concerns, and adapt practical recommendations to their preferred practice model. The AI generates a JSON response containing the personalized content with seven distinct sections, which is then stored in the database.

Once all lesson personalizations are complete, the system returns a success response to the frontend, including the student's profile ID. The frontend can then redirect the student to their personalized dashboard, where they can access all lessons with customized content. Subsequent requests for lesson content can be served through the `/api/persona/block` endpoint, which retrieves the pre-generated personalized content from the database and returns it as HTML for immediate display.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L267-L370) - *New implementation*
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)

## Data Flow Architecture

```mermaid
graph LR
A[GetCourse LMS] --> |Embedded iframe| B[Survey Form]
B --> C[/api/survey<br>POST Request]
C --> D[Supabase Database]
D --> |Store Profile| E[profiles Table]
C --> F[Load Lesson Transcripts]
F --> G[lessons.content.transcription]
C --> H[OpenAI API]
H --> |Generate Personalization| I[GPT-4o]
I --> J[Personalized Content]
J --> D --> |Store Personalization| K[personalized_lesson_descriptions Table]
L[Student Dashboard] --> M[/api/persona/block<br>POST Request]
M --> D --> |Retrieve Personalization| K
K --> N[Formatted HTML Block]
N --> L
O[External Website] --> |Embed| P[HTML Block]
P --> N
style A fill:#f9f,stroke:#333
style B fill:#bbf,stroke:#333
style C fill:#f96,stroke:#333
style D fill:#6f9,stroke:#333
style H fill:#6f9,stroke:#333
style L fill:#bbf,stroke:#333
style M fill:#f96,stroke:#333
style O fill:#f9f,stroke:#333
```

**Diagram sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L0-L139)
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L63-L93) - *New implementation*

## Frontend Architecture

The frontend architecture is built on Next.js App Router with React Server Components, leveraging modern React features for optimal performance and developer experience. The application structure follows a feature-based organization, with top-level directories for app, components, lib, and store. The app directory contains the main application routes, including the survey interface, dashboard, and API endpoints, organized in a logical hierarchy that reflects the user journey.

The component architecture is modular and reusable, with components organized by feature area. The personalizations directory contains components for editing and displaying personalized lesson content, while the profiles directory includes components for user selection and survey display. Shared UI components such as buttons, cards, inputs, and layout elements are housed in the ui directory, promoting consistency across the application. These components are built with TypeScript and use Tailwind CSS for styling, ensuring type safety and responsive design.

React Server Components play a crucial role in the architecture, allowing server-side data fetching and rendering while minimizing client-side JavaScript. This approach improves performance by reducing the amount of code sent to the client and enabling faster initial page loads. The use of Server Components is particularly beneficial for data-intensive pages like the dashboard, where user profiles and personalizations need to be fetched and rendered efficiently.

The frontend communicates with the backend through API routes, using standard HTTP methods to create, read, update, and delete resources. The application handles both form submissions (such as survey data) and dynamic content requests (such as personalized lesson blocks) through these API endpoints. Error handling and loading states are implemented throughout the UI to provide a smooth user experience, with appropriate feedback for successful operations and error conditions.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [components/profiles/profile-survey.tsx](file://components/profiles/profile-survey.tsx#L0-L66)
- [components/personalizations/personalized-lesson.tsx](file://components/personalizations/personalized-lesson.tsx#L0-L26)
- [app/page.tsx](file://app/page.tsx)
- [app/layout.tsx](file://app/layout.tsx)

## API Endpoints and Integration Points

The Persona application exposes several API endpoints that serve as integration points with both internal components and external systems. The `/api/survey` endpoint is the primary entry point for user onboarding, accepting POST requests with survey data and returning profile information. This endpoint handles user profile creation or updates, triggers the personalization process for all course lessons using full transcripts, and manages database operations through Supabase.

The `/api/persona/personalize-template` endpoint has been deprecated following the architectural refactoring to transcript-driven personalization. The `/api/persona/block` endpoint serves as the primary integration point with external systems, returning pre-rendered HTML blocks containing personalized lesson descriptions. This endpoint is designed for easy embedding in external websites and LMS platforms through iframes or JavaScript integration. It handles CORS headers appropriately and returns structured responses that include both the HTML content and caching information.

Additional API endpoints include `/api/lessons` for retrieving lesson lists, `/api/personalizations` for managing personalized content, and profile-specific routes for retrieving user information. These endpoints follow RESTful principles with clear request and response formats, making them easy to understand and integrate. The API layer is protected by appropriate error handling and validation, ensuring robust operation even under unexpected conditions.

All API endpoints utilize standardized HTTP utilities from `lib/utils/http.ts` including `CORS_HEADERS`, `createCorsResponse`, `createErrorResponse`, and `createOptionsHandler` to ensure consistent response patterns and proper CORS handling across the application.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [app/api/lessons/route.ts](file://app/api/lessons/route.ts#L0-L20)
- [lib/utils/http.ts](file://lib/utils/http.ts#L1-L73) - *Updated in recent commit*

## Personalization Engine and Transcript Processing

The personalization engine is the core intelligence of the Persona application, transforming generic lesson content into personalized learning experiences. This engine has been fundamentally refactored to process full lesson transcripts directly rather than compressed templates, enabling significantly richer and more contextually accurate personalization.

The new system operates by combining three key inputs: user profile data from surveys, complete lesson transcripts stored in the database, and AI-generated content through OpenAI's GPT-4o model. The transcripts, stored in the `lessons.content.transcription` JSONB field, contain the complete text of each lesson (15-30KB), preserving all contextual details that were previously lost in template compression.

When personalizing a lesson, the system first loads the transcript from the database using the `loadLessonTranscript` function. It then constructs a detailed prompt for the AI model that includes the full transcript, the student's profile information, and specific instructions for personalization. The prompt directs the AI to address the student by name, consider their motivations and goals, address their fears and concerns, adapt practical recommendations to their preferred practice model, and connect the lesson content to their expected outcomes.

The AI processes this prompt and returns a JSON response with the personalized content in a seven-section structure:
- **introduction**: 2-3 sentences addressing the student by name
- **why_it_matters_for_you**: 4-5 sentences connecting lesson content to student goals
- **key_takeaways**: 3-4 specific outcomes from the transcript
- **practical_application**: 3-4 sentences for practical implementation
- **addressing_fears**: 2-3 sentences addressing specific concerns
- **personalized_homework**: 2-4 sentences for homework assignments
- **motivational_quote**: 1 sentence for motivation

This structured approach ensures consistency across lessons while allowing for deep personalization. The system handles transcript validation, with fallback mechanisms for missing or incomplete transcripts. The resulting personalized content is stored in the database, associating it with the specific user and lesson for future retrieval.

The personalization logic is centralized in the `lib/services/personalization-engine.ts` module, which exports the `generatePersonalizedDescription` function that handles the complete personalization workflow including transcript loading, prompt creation, OpenAI API calls, and error handling with fallback to original template content.

**Section sources**
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L20-L28) - *New implementation*
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L267-L370) - *New implementation*
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [store/user_profiles.json](file://store/user_profiles.json#L0-L269)

## External Integrations

The Persona application integrates with several external services to deliver a comprehensive educational experience. The primary integration is with GetCourse, an external LMS platform that serves as the entry point for students. The application provides an iframe-embeddable survey form that can be seamlessly integrated into GetCourse course pages, allowing students to complete their personalization survey without leaving the LMS environment. Upon survey completion, the application sends a message event to the parent window with the student's profile ID and dashboard URL, enabling GetCourse to redirect the student to their personalized content.

The integration with Supabase provides the application with a robust backend-as-a-service solution, handling user authentication, database operations, and file storage. Supabase's PostgreSQL database stores user profiles, lesson information, transcripts, and personalized content, while its authentication system manages user sessions and access control. The application uses both client-side and server-side Supabase clients to handle different types of database operations, with server-side clients for API routes and client-side clients for frontend interactions.

The integration with OpenAI's API enables the AI-powered personalization features that are central to the application's value proposition. The system uses the GPT-4o model to generate personalized lesson content based on full lesson transcripts and user profiles. This represents a significant upgrade from the previous GPT-4o-mini model, enabling processing of complete lesson context. This integration is designed with appropriate error handling and fallback mechanisms, ensuring that the system remains functional even when AI processing encounters issues. The application manages API rate limits and costs through careful request batching and caching strategies.

Additional integrations include support for external video platforms and potential future integrations with other LMS platforms. The system architecture is designed to be extensible, with clear separation between core functionality and integration points, making it relatively straightforward to add new external services as needed.

**Section sources**
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L0-L10)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/openai.ts](file://lib/openai.ts#L0-L7)

## Fallback Mechanisms

The Persona application incorporates several fallback mechanisms to ensure reliability and graceful degradation when components fail. The most critical fallback occurs in the AI personalization process: when OpenAI API calls fail or return invalid responses, the system falls back to using a basic personalized template without deep personalization. This ensures that students always receive relevant lesson content, even if it lacks the richness of AI-generated personalization. The fallback is implemented in both the `/api/survey` and `/api/persona/personalize-template` endpoints, with error handling that catches API exceptions and returns the base template.

For user profiles, the system handles both new and returning users through a unified profile management system. If a user with a specific identifier already exists, their profile is updated rather than creating a duplicate. For users without identifiers (guests), the system generates temporary identifiers, allowing them to access personalized content while acknowledging the limitations of this approach. The profile system also handles missing or incomplete survey data gracefully, displaying appropriate messages to users and allowing them to complete their profiles later.

Database operations include comprehensive error handling, with appropriate logging and user feedback for failed operations. The system distinguishes between different types of database errors, providing specific guidance for recoverable issues (such as validation errors) while gracefully handling unrecoverable errors. The API endpoints return meaningful error messages and HTTP status codes, enabling frontend components to display appropriate feedback to users.

The HTML block generation endpoints include fallback content for various error conditions, such as missing user profiles or lessons. When a user has not completed their survey, the system returns a call-to-action encouraging them to do so, rather than displaying generic or irrelevant content. Similarly, when specific lesson content cannot be found, the system returns a warning message rather than failing silently. These fallbacks ensure that embedded content always provides a meaningful user experience, even when underlying systems encounter issues.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)

## Technical Decisions

The technical architecture of the Persona application reflects several key decisions that balance functionality, performance, and maintainability. The choice of Next.js App Router with React Server Components provides a modern foundation for server-rendered React applications, offering improved performance, better SEO, and simplified data fetching compared to traditional client-side rendering approaches. This decision aligns with current best practices in React development and enables efficient handling of data-intensive pages like the student dashboard.

The use of Supabase as the primary backend service represents a strategic decision to leverage backend-as-a-service capabilities, reducing operational overhead while providing robust database functionality, authentication, and real-time features. This choice allows the development team to focus on application logic rather than infrastructure management, accelerating development and reducing maintenance costs. The integration with PostgreSQL ensures data integrity and supports complex queries needed for reporting and analytics.

The selection of OpenAI's GPT-4o model for AI processing represents a significant upgrade from the previous GPT-4o-mini model, balancing enhanced capability with cost considerations. This model provides sufficient intelligence for deep content personalization tasks by processing full lesson transcripts (15-30KB) rather than compressed templates (1-2KB), enabling more contextually accurate and richer personalization. The decision to upgrade reflects a strategic investment in content quality that should yield returns through improved student engagement and retention.

The database-centric data storage approach—storing transcripts in the database rather than file system—demonstrates thoughtful architectural design. This approach leverages the strengths of database storage: transactional integrity, complex queries, and scalability, while eliminating the challenges of file system synchronization and template management. The separation of concerns between dynamic user data and static lesson content enhances system maintainability and scalability.

The API design follows RESTful principles with clear endpoints for specific functions, promoting ease of integration and understandability. The inclusion of standardized HTTP utilities from `lib/utils/http.ts` ensures consistent response patterns, proper CORS handling, and uniform error formatting across all endpoints. The decision to return HTML blocks from certain endpoints rather than raw data simplifies integration with external systems, reducing the burden on consuming applications to format and style content.

The refactoring to a transcript-driven personalization engine with centralized business logic in the `lib/services/personalization-engine.ts` directory improves code maintainability and reduces duplication. This modular approach allows for easier testing, better separation of concerns, and more efficient development workflows.

**Section sources**
- [next.config.ts](file://next.config.ts#L0-L15)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L0-L10)
- [lib/openai.ts](file://lib/openai.ts#L0-L7)
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L170) - *Updated in recent commit*
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [lib/services/personalization-engine.ts](file://lib/services/personalization-engine.ts#L20-L28) - *New implementation*
- [lib/utils/http.ts](file://lib/utils/http.ts#L1-L73) - *Updated in recent commit*