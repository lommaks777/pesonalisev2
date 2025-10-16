# HTTP Utilities

<cite>
**Referenced Files in This Document**   
- [http.ts](file://lib/utils/http.ts) - *Updated in recent commit*
- [block/route.ts](file://app/api/persona/block/route.ts) - *Uses HTTP utilities*
- [personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts) - *Uses HTTP utilities*
- [next.config.ts](file://next.config.ts) - *Added in recent commit*
- [vercel.json](file://vercel.json) - *Added in recent commit*
</cite>

## Update Summary
**Changes Made**   
- Updated documentation to reflect dual CORS implementation strategy
- Added information about server-level CORS configuration in next.config.ts and vercel.json
- Enhanced integration patterns section with complete CORS handling approach
- Updated troubleshooting guidance to include server-level configuration checks
- Added new diagram showing complete CORS handling architecture

## Table of Contents
1. [Introduction](#introduction)
2. [Core Components](#core-components)
3. [API Interfaces](#api-interfaces)
4. [Integration Patterns](#integration-patterns)
5. [Practical Examples](#practical-examples)
6. [Troubleshooting Guidance](#troubleshooting-guidance)

## Introduction
The HTTP Utilities module provides standardized response handling and CORS configuration for the Persona application's API endpoints. This utility layer ensures consistent HTTP response patterns across all API routes, particularly for cross-origin requests from external platforms like GetCourse. The implementation supports the application's personalized learning experience by enabling secure, reliable communication between the frontend interface and backend services.

The module has been enhanced with a dual-layer CORS strategy that combines code-level utilities with server-level configuration. This approach ensures robust cross-origin support through both application code and deployment configuration, providing redundancy and comprehensive coverage for API endpoints.

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)

## Core Components
The HTTP Utilities module consists of standardized response generators and CORS configuration that are used across multiple API endpoints. The core components include a shared CORS configuration object and three utility functions for creating consistent HTTP responses. These utilities are imported and used in various API routes to maintain uniform response formats and proper cross-origin headers.

The module exports a constant `CORS_HEADERS` containing standard CORS directives that allow cross-origin POST and OPTIONS requests with Content-Type headers. It also provides three functions: `createCorsResponse` for successful responses with CORS headers, `createErrorResponse` for standardized error responses, and `createOptionsHandler` for handling CORS preflight requests. These components work together to ensure API endpoints can be securely accessed from external domains while maintaining consistent response structures.

Additionally, the application implements server-level CORS configuration through both Next.js configuration and Vercel deployment settings, creating a comprehensive CORS strategy that operates at multiple levels of the application stack.

```mermaid
classDiagram
class HTTPUtils {
+CORS_HEADERS : Record<string,string>
+createCorsResponse(data, status?) : NextResponse
+createErrorResponse(message, status?, cors?) : NextResponse
+createOptionsHandler() : NextResponse
}
class ErrorResponse {
+ok : boolean
+error : string
}
class SuccessResponse {
+ok : boolean
+data? : any
+cached? : boolean
}
class ServerConfig {
+next.config.ts
+vercel.json
}
HTTPUtils --> ErrorResponse : "creates"
HTTPUtils --> SuccessResponse : "creates"
ServerConfig --> HTTPUtils : "complements"
```

**Diagram sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)

## API Interfaces
The HTTP Utilities module provides three main API interfaces for handling HTTP responses in the application. The `CORS_HEADERS` constant contains the standard CORS configuration used across API routes, allowing cross-origin requests from external platforms. This configuration includes headers for allowed origin (*), methods (GET, POST, PUT, DELETE, OPTIONS), and request headers (Content-Type, Authorization, X-Requested-With), with a max age of 86400 seconds (24 hours).

The `createCorsResponse` function creates successful JSON responses with CORS headers. It accepts any data object and an optional status code (defaulting to 200) and returns a NextResponse with the data serialized as JSON and CORS headers applied. This function is used to return successful API responses that need to be accessible from external domains.

The `createErrorResponse` function generates standardized error responses with consistent formatting. It takes an error message string, an optional status code (defaulting to 500), and a boolean flag to include CORS headers (defaulting to true). It returns a NextResponse with an error object containing ok: false and the error message, ensuring clients receive predictable error formats.

The `createOptionsHandler` function provides a generic handler for CORS preflight (OPTIONS) requests. It returns a 200 status response with the standard CORS headers, satisfying browser preflight requirements for cross-origin requests. This function is typically exported directly as the OPTIONS method handler in API routes.

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)

## Integration Patterns
The HTTP Utilities are integrated into API routes that serve content to external platforms, particularly the GetCourse LMS integration. The primary integration pattern involves importing the utilities in API route files and using them to generate consistent responses with proper CORS headers. This pattern is implemented in endpoints like `/api/persona/block` and `/api/persona/personalize-template`, which deliver personalized lesson content to GetCourse pages via iframe embedding.

The integration follows a standard pattern where API routes import the HTTP utilities and use them in their request handlers. For POST requests, the route processes the business logic and uses `createCorsResponse` to return successful responses with CORS headers. When errors occur, the route uses `createErrorResponse` to return properly formatted error responses. The `createOptionsHandler` is typically exported directly as the OPTIONS method to handle CORS preflight requests automatically.

A key enhancement in the integration pattern is the dual-layer CORS strategy. In addition to the code-level utilities, the application implements server-level CORS configuration through both Next.js configuration (`next.config.ts`) and Vercel deployment settings (`vercel.json`). This multi-layered approach ensures that CORS headers are applied consistently across all API routes, even if individual route handlers were to omit them.

```mermaid
flowchart TD
A[Client Request] --> B{Request Type}
B --> |OPTIONS| C[createOptionsHandler]
B --> |Success| D[createCorsResponse]
B --> |Error| E[createErrorResponse]
C --> F[Return 200 with CORS Headers]
D --> G[Return JSON with CORS Headers]
E --> H[Return Error JSON with CORS Headers]
F --> I[Response Sent]
G --> I
H --> I
J[Server Configuration] --> K[next.config.ts]
J --> L[vercel.json]
K --> M[Apply CORS Headers]
L --> M
M --> I
```

**Diagram sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)
- [block/route.ts](file://app/api/persona/block/route.ts#L1-L120)
- [personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L1-L113)

## Practical Examples
The HTTP Utilities are used in API routes that serve personalized content to external platforms. A practical example is the `/api/persona/block` endpoint, which returns HTML blocks for personalized lesson content. When a request is received, the endpoint validates the user ID and lesson information, then retrieves the corresponding personalized content from the database. If successful, it uses `createCorsResponse` to return the HTML content with proper CORS headers, allowing the response to be used in cross-origin contexts.

Another example is error handling in API routes. When a required parameter is missing or a database query fails, the route uses `createErrorResponse` to return a standardized error response. For instance, if a user profile cannot be found, the endpoint returns an error response with status 400 and a descriptive message. This consistent error format helps client applications handle errors predictably.

For CORS preflight requests, the `createOptionsHandler` function is used as the OPTIONS method handler. When a browser sends a preflight OPTIONS request before a cross-origin POST request, the API route directly exports `createOptionsHandler` as the handler function. This automatically returns a 200 status response with the required CORS headers, allowing the subsequent POST request to proceed.

The dual-layer CORS implementation is demonstrated in both `next.config.ts` and `vercel.json`, where CORS headers are configured at the server level to apply to all API routes matching the pattern `/api/:path*`. This server-level configuration complements the code-level utilities, ensuring comprehensive CORS support.

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [block/route.ts](file://app/api/persona/block/route.ts#L1-L120)
- [personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts#L1-L113)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)

## Troubleshooting Guidance
When troubleshooting issues with the HTTP Utilities, start by checking the browser's developer console for CORS-related errors. Common issues include missing or incorrect CORS headers, which can prevent cross-origin requests from succeeding. Verify that API responses include the expected CORS headers (Access-Control-Allow-Origin, Access-Control-Allow-Methods, and Access-Control-Allow-Headers) by inspecting the network requests in the browser's developer tools.

If API endpoints return unexpected error responses, check that `createErrorResponse` is being called with appropriate status codes and error messages. Ensure that error handling code properly catches exceptions and converts them to HTTP responses using the utility functions. Missing try-catch blocks or direct NextResponse.json calls without CORS headers can cause integration issues.

For OPTIONS preflight requests failing, verify that the API route properly exports `createOptionsHandler` as the OPTIONS method handler. Preflight requests must receive a 200 status response with CORS headers before the browser will send the actual request. If the OPTIONS handler is missing or returns an error, the preflight will fail.

When debugging response formatting issues, confirm that `createCorsResponse` is used for successful responses instead of direct NextResponse.json calls. This ensures consistent response structures across all endpoints. Also verify that the response data matches the expected format, particularly the "ok" field in success responses.

Additionally, check the server-level CORS configuration in `next.config.ts` and `vercel.json`. These configuration files define CORS headers that apply to all API routes, providing a safety net even if individual route handlers were to omit CORS headers. Ensure that the configuration patterns (e.g., `/api/:path*`) correctly match the API routes that need CORS support.

Finally, ensure that the HTTP Utilities module is properly imported in API route files. Missing imports or incorrect import paths can prevent the utility functions from being available, leading to inconsistent response handling and CORS issues.

**Section sources**
- [http.ts](file://lib/utils/http.ts#L1-L77)
- [next.config.ts](file://next.config.ts#L1-L43)
- [vercel.json](file://vercel.json#L1-L27)
- [block/route.ts](file://app/api/persona/block/route.ts#L1-L120)