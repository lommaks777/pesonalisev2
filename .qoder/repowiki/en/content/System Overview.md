# System Overview

<cite>
**Referenced Files in This Document**   
- [app/api/survey/route.ts](file://app/api/survey/route.ts)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/supabase/types.ts](file://lib/supabase/types.ts)
- [lib/openai.ts](file://lib/openai.ts)
- [components/profiles/profile-survey.tsx](file://components/profiles/profile-survey.tsx)
- [components/personalizations/personalized-lesson.tsx](file://components/personalizations/personalized-lesson.tsx)
- [store/user_profiles.json](file://store/user_profiles.json)
- [store/shvz/lessons](file://store/shvz/lessons)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md)
- [PERSONALIZATION_API.md](file://PERSONALIZATION_API.md)
- [SYSTEM_OVERVIEW.md](file://SYSTEM_OVERVIEW.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Business Goals and Target Users](#business-goals-and-target-users)
3. [Core Architecture Components](#core-architecture-components)
4. [System Flow: From Survey to Personalized Lessons](#system-flow-from-survey-to-personalized-lessons)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [API Endpoints and Integration Points](#api-endpoints-and-integration-points)
8. [Personalization Engine and JSON Templates](#personalization-engine-and-json-templates)
9. [External Integrations](#external-integrations)
10. [Fallback Mechanisms](#fallback-mechanisms)
11. [Technical Decisions](#technical-decisions)

## Introduction

The Persona application is an AI-powered personalized education platform designed specifically for massage therapy students. This system transforms standardized educational content into highly personalized learning experiences by leveraging user profiles, comprehensive surveys, and AI-driven content generation. The platform's primary purpose is to enhance learning effectiveness by tailoring educational materials to individual student needs, goals, and preferences.

The system architecture integrates multiple technologies and services to create a seamless flow from user onboarding through personalized lesson delivery. At its core, the application uses Next.js App Router with React Server Components to deliver a dynamic, server-rendered user interface that efficiently handles both static content and real-time personalization. User interactions begin with a comprehensive survey that captures critical information about the student's background, motivations, target clients, desired skills, fears, expected outcomes, and preferred practice models.

This information is then processed through an AI-powered personalization engine that generates customized lesson content for each student. The system integrates with Supabase for data persistence, OpenAI for AI content generation, and external Learning Management Systems (LMS) like GetCourse for user acquisition and course delivery. The architecture is designed to be scalable, with clear separation of concerns between frontend presentation, API routes, database operations, and external service integrations.

The platform serves multiple stakeholders: students receive personalized educational content that addresses their specific needs and concerns; administrators can monitor user engagement and system performance; and developers benefit from a well-structured codebase with clear API contracts and modular components. This documentation provides a comprehensive overview of the system architecture, explaining how these components work together to deliver a personalized learning experience.

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

The API layer exposes several critical endpoints that handle different aspects of the personalization workflow. The `/api/survey` endpoint processes user survey submissions, creating or updating user profiles in the database and triggering the personalization process for all course lessons. The `/api/persona/personalize-template` endpoint generates personalized lesson content by combining user profile data with predefined lesson templates and AI processing. The `/api/persona/block` endpoint delivers pre-rendered HTML blocks containing personalized lesson descriptions for integration into external platforms.

The data layer is powered by Supabase, which provides a PostgreSQL database with a well-defined schema for storing user profiles, lessons, courses, and personalized lesson descriptions. The `profiles` table stores user information including names, identifiers, course enrollments, and survey responses, while the `personalized_lesson_descriptions` table contains the AI-generated personalized content for each user-lesson combination. The system also utilizes a file-based storage system in the `store/` directory for lesson templates and processing queues, providing a hybrid approach to data management.

The AI processing layer leverages OpenAI's GPT-4o-mini model to generate personalized content based on user profiles and lesson templates. This layer is integrated throughout the system, with AI calls occurring during both bulk personalization (when a user first submits their survey) and on-demand personalization (when specific lesson content is requested). The system includes error handling and fallback mechanisms to ensure reliability even when AI processing encounters issues.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L0-L293)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L0-L139)
- [components/profiles/profile-survey.tsx](file://components/profiles/profile-survey.tsx#L0-L66)
- [components/personalizations/personalized-lesson.tsx](file://components/personalizations/personalized-lesson.tsx#L0-L26)

## System Flow: From Survey to Personalized Lessons

The system flow begins when a student accesses the survey form, typically through an iframe embedded in an external LMS like GetCourse. The student completes the survey, providing information about their name, motivation, target clients, desired skills, fears, expected results, and practice model. Upon submission, the frontend sends this data to the `/api/survey` endpoint, initiating the personalization workflow.

The API processes the survey data in several sequential steps. First, it validates the required fields and creates or updates a user profile in the Supabase database. If the student has a user identifier from GetCourse, this is used to link their profile across systems; otherwise, a guest identifier is generated. The profile stores all survey responses as JSON data, preserving the student's input for future personalization.

Next, the system retrieves all lessons for the enrolled course from the database. For each lesson, it triggers the personalization process by loading a corresponding JSON template from the file system. These templates contain the base content for each lesson, including summary descriptions, key points, and homework suggestions. The system then uses the OpenAI API to generate personalized content by combining the lesson template with the student's profile information.

The personalization process involves sending a carefully crafted prompt to the GPT-4o-mini model, instructing it to adapt the lesson content based on the student's specific characteristics. The prompt includes the original template, the student's survey responses, and specific instructions to address the student by name, consider their motivations and goals, address their fears and concerns, and adapt practical recommendations to their preferred practice model. The AI generates a JSON response containing the personalized content, which is then stored in the database.

Once all lesson personalizations are complete, the system returns a success response to the frontend, including the student's profile ID. The frontend can then redirect the student to their personalized dashboard, where they can access all lessons with customized content. Subsequent requests for lesson content can be served through the `/api/persona/block` endpoint, which retrieves the pre-generated personalized content from the database and returns it as HTML for immediate display.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L0-L293)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)
- [PERSONALIZATION_API.md](file://PERSONALIZATION_API.md#L0-L271)

## Data Flow Architecture

```mermaid
graph LR
A[GetCourse LMS] --> |Embedded iframe| B[Survey Form]
B --> C[/api/survey<br>POST Request]
C --> D[Supabase Database]
D --> |Store Profile| E[profiles Table]
C --> F[Load Lesson Templates]
F --> G[store/shvz/*.json]
C --> H[OpenAI API]
H --> |Generate Personalization| I[GPT-4o-mini]
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
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L0-L139)
- [store/shvz/lessons](file://store/shvz/lessons)

## Frontend Architecture

The frontend architecture is built on Next.js App Router with React Server Components, leveraging modern React features for optimal performance and developer experience. The application structure follows a feature-based organization, with top-level directories for app, components, lib, and store. The app directory contains the main application routes, including the survey interface, dashboard, and API endpoints, organized in a logical hierarchy that reflects the user journey.

The component architecture is modular and reusable, with components organized by feature area. The personalizations directory contains components for editing and displaying personalized lesson content, while the profiles directory includes components for user selection and survey display. Shared UI components such as buttons, cards, inputs, and layout elements are housed in the ui directory, promoting consistency across the application. These components are built with TypeScript and use Tailwind CSS for styling, ensuring type safety and responsive design.

React Server Components play a crucial role in the architecture, allowing server-side data fetching and rendering while minimizing client-side JavaScript. This approach improves performance by reducing the amount of code sent to the client and enabling faster initial page loads. The use of Server Components is particularly beneficial for data-intensive pages like the dashboard, where user profiles and personalizations need to be fetched and rendered efficiently.

The frontend communicates with the backend through API routes, using standard HTTP methods to create, read, update, and delete resources. The application handles both form submissions (such as survey data) and dynamic content requests (such as personalized lesson blocks) through these API endpoints. Error handling and loading states are implemented throughout the UI to provide a smooth user experience, with appropriate feedback for successful operations and error conditions.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [components/profiles/profile-survey.tsx](file://components/profiles/profile-survey.tsx#L0-L66)
- [components/personalizations/personalized-lesson.tsx](file://components/personalizations/personalized-lesson.tsx#L0-L26)
- [app/page.tsx](file://app/page.tsx)
- [app/layout.tsx](file://app/layout.tsx)

## API Endpoints and Integration Points

The Persona application exposes several API endpoints that serve as integration points with both internal components and external systems. The `/api/survey` endpoint is the primary entry point for user onboarding, accepting POST requests with survey data and returning profile information. This endpoint handles user profile creation or updates, triggers the personalization process for all course lessons, and manages database operations through Supabase.

The `/api/persona/personalize-template` endpoint generates personalized lesson content by combining user profile data with predefined templates and AI processing. It accepts user identifiers and lesson numbers as parameters, retrieves the corresponding profile and lesson template, and uses OpenAI to generate personalized content. This endpoint supports both immediate processing and caching through the flush parameter, allowing for efficient content delivery.

The `/api/persona/block` endpoint serves as the primary integration point with external systems, returning pre-rendered HTML blocks containing personalized lesson descriptions. This endpoint is designed for easy embedding in external websites and LMS platforms through iframes or JavaScript integration. It handles CORS headers appropriately and returns structured responses that include both the HTML content and caching information.

Additional API endpoints include `/api/lessons` for retrieving lesson lists, `/api/personalizations` for managing personalized content, and profile-specific routes for retrieving user information. These endpoints follow RESTful principles with clear request and response formats, making them easy to understand and integrate. The API layer is protected by appropriate error handling and validation, ensuring robust operation even under unexpected conditions.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L0-L293)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)
- [app/api/lessons/route.ts](file://app/api/lessons/route.ts#L0-L20)
- [PERSONALIZATION_API.md](file://PERSONALIZATION_API.md#L0-L271)

## Personalization Engine and JSON Templates

The personalization engine is the core intelligence of the Persona application, transforming generic lesson content into personalized learning experiences. This engine operates by combining three key inputs: user profile data from surveys, predefined lesson templates stored as JSON files, and AI-generated content through OpenAI's GPT-4o-mini model. The JSON templates, located in the `store/shvz/` directory, contain the base structure and content for each lesson, including summary descriptions, key learning points, practical actions, and homework suggestions.

When personalizing a lesson, the system first loads the appropriate template based on the lesson number and a mapping of lesson IDs. It then constructs a detailed prompt for the AI model that includes the template content, the student's profile information, and specific instructions for personalization. The prompt directs the AI to address the student by name, consider their motivations and goals, address their fears and concerns, adapt practical recommendations to their preferred practice model, and connect the lesson content to their expected outcomes.

The AI processes this prompt and returns a JSON response with the personalized content, maintaining the same structure as the original template but with customized text. This approach ensures consistency across lessons while allowing for deep personalization. The system handles various template formats and naming conventions, providing flexibility in content management. The resulting personalized content is stored in the database, associating it with the specific user and lesson for future retrieval.

The JSON template structure includes fields such as `summary_short`, `why_watch`, `quick_action`, `social_share`, and `homework_20m`, each designed to address a specific aspect of the learning experience. This structured approach allows the frontend to consistently render personalized content while giving the AI clear guidance on what information to generate for each section. The template-based system also facilitates content updates, as changes to the base templates can be propagated to all users through re-personalization.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L0-L293)
- [store/shvz/lessons](file://store/shvz/lessons)
- [store/user_profiles.json](file://store/user_profiles.json#L0-L269)

## External Integrations

The Persona application integrates with several external services to deliver a comprehensive educational experience. The primary integration is with GetCourse, an external LMS platform that serves as the entry point for students. The application provides an iframe-embeddable survey form that can be seamlessly integrated into GetCourse course pages, allowing students to complete their personalization survey without leaving the LMS environment. Upon survey completion, the application sends a message event to the parent window with the student's profile ID and dashboard URL, enabling GetCourse to redirect the student to their personalized content.

The integration with Supabase provides the application with a robust backend-as-a-service solution, handling user authentication, database operations, and file storage. Supabase's PostgreSQL database stores user profiles, lesson information, and personalized content, while its authentication system manages user sessions and access control. The application uses both client-side and server-side Supabase clients to handle different types of database operations, with server-side clients for API routes and client-side clients for frontend interactions.

The integration with OpenAI's API enables the AI-powered personalization features that are central to the application's value proposition. The system uses the GPT-4o-mini model to generate personalized lesson content based on user profiles and lesson templates. This integration is designed with appropriate error handling and fallback mechanisms, ensuring that the system remains functional even when AI processing encounters issues. The application manages API rate limits and costs through careful request batching and caching strategies.

Additional integrations include support for external video platforms and potential future integrations with other LMS platforms. The system architecture is designed to be extensible, with clear separation between core functionality and integration points, making it relatively straightforward to add new external services as needed.

**Section sources**
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L0-L279)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L0-L10)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/openai.ts](file://lib/openai.ts#L0-L7)

## Fallback Mechanisms

The Persona application incorporates several fallback mechanisms to ensure reliability and graceful degradation when components fail. The most critical fallback occurs in the AI personalization process: when OpenAI API calls fail or return invalid responses, the system falls back to using the original lesson template without personalization. This ensures that students always receive relevant lesson content, even if it lacks personalization. The fallback is implemented in both the `/api/survey` and `/api/persona/personalize-template` endpoints, with error handling that catches API exceptions and returns the base template.

For user profiles, the system handles both new and returning users through a unified profile management system. If a user with a specific identifier already exists, their profile is updated rather than creating a duplicate. For users without identifiers (guests), the system generates temporary identifiers, allowing them to access personalized content while acknowledging the limitations of this approach. The profile system also handles missing or incomplete survey data gracefully, displaying appropriate messages to users and allowing them to complete their profiles later.

Database operations include comprehensive error handling, with appropriate logging and user feedback for failed operations. The system distinguishes between different types of database errors, providing specific guidance for recoverable issues (such as validation errors) while gracefully handling unrecoverable errors. The API endpoints return meaningful error messages and HTTP status codes, enabling frontend components to display appropriate feedback to users.

The HTML block generation endpoints include fallback content for various error conditions, such as missing user profiles or lessons. When a user has not completed their survey, the system returns a call-to-action encouraging them to do so, rather than displaying generic or irrelevant content. Similarly, when specific lesson content cannot be found, the system returns a warning message rather than failing silently. These fallbacks ensure that embedded content always provides a meaningful user experience, even when underlying systems encounter issues.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L0-L293)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)

## Technical Decisions

The technical architecture of the Persona application reflects several key decisions that balance functionality, performance, and maintainability. The choice of Next.js App Router with React Server Components provides a modern foundation for server-rendered React applications, offering improved performance, better SEO, and simplified data fetching compared to traditional client-side rendering approaches. This decision aligns with current best practices in React development and enables efficient handling of data-intensive pages like the student dashboard.

The use of Supabase as the primary backend service represents a strategic decision to leverage backend-as-a-service capabilities, reducing operational overhead while providing robust database functionality, authentication, and real-time features. This choice allows the development team to focus on application logic rather than infrastructure management, accelerating development and reducing maintenance costs. The integration with PostgreSQL ensures data integrity and supports complex queries needed for reporting and analytics.

The selection of OpenAI's GPT-4o-mini model for AI processing balances cost, performance, and capability. This model provides sufficient intelligence for content personalization tasks while remaining cost-effective for high-volume operations. The decision to use a smaller, more efficient model rather than larger, more expensive alternatives reflects a practical approach to AI integration that considers both functionality and economic sustainability.

The hybrid data storage approach—combining database storage for structured data with file-based storage for lesson templates—demonstrates thoughtful architectural design. This approach leverages the strengths of each storage method: databases for transactional integrity and complex queries, and files for flexible, version-controlled content management. The separation of concerns between dynamic user data and static lesson content enhances system maintainability and scalability.

The API design follows RESTful principles with clear endpoints for specific functions, promoting ease of integration and understandability. The inclusion of CORS headers and proper error handling in all endpoints ensures robust operation in distributed environments. The decision to return HTML blocks from certain endpoints rather than raw data simplifies integration with external systems, reducing the burden on consuming applications to format and style content.

**Section sources**
- [next.config.ts](file://next.config.ts#L0-L15)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L0-L10)
- [lib/openai.ts](file://lib/openai.ts#L0-L7)
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L0-L318)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L0-L197)