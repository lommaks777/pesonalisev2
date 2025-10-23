# CORS Implementation

<cite>
**Referenced Files in This Document**   
- [next.config.ts](file://next.config.ts)
- [vercel.json](file://vercel.json)
- [lib/utils/http.ts](file://lib/utils/http.ts)
- [app/api/survey/route.ts](file://app/api/survey/route.ts)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts)
- [app/api/persona/personalize-template/route.ts](file://app/api/persona/personalize-template/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [CORS Configuration](#cors-configuration)
3. [Supported Methods and Headers](#supported-methods-and-headers)
4. [Preflight Request Handling](#preflight-request-handling)
5. [Security Considerations](#security-considerations)
6. [Client-Side Implementation Examples](#client-side-implementation-examples)
7. [Deployment and CDN Configuration](#deployment-and-cdn-configuration)
8. [Testing and Validation](#testing-and-validation)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the CORS (Cross-Origin Resource Sharing) implementation in the application. The system enables secure cross-origin API access from external domains, particularly for integration with the `shkolamasterov.online` domain. The implementation includes multiple layers of CORS configuration across the application stack, ensuring compatibility with Next.js, Vercel deployment, and client-side requirements.

The CORS system was implemented to resolve access blocking issues when client applications attempted to make requests to API endpoints. The solution involves coordinated configuration at the framework, application, and infrastructure levels to ensure proper handling of preflight (OPTIONS) requests and appropriate response headers for all API methods.

**Section sources**
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md)

## CORS Configuration
The CORS implementation uses a multi-layered approach to ensure consistent header delivery across all deployment environments. The configuration is defined in three key locations: utility functions, Next.js configuration, and Vercel platform settings.

The primary CORS configuration is centralized in the `CORS_HEADERS` constant within `lib/utils/http.ts`. This object defines the standard headers applied to all API responses:

- `Access-Control-Allow-Origin: *` - Allows requests from any origin
- `Access-Control-Allow-Methods` - Specifies permitted HTTP methods
- `Access-Control-Allow-Headers` - Lists allowed request headers
- `Access-Control-Max-Age: 86400` - Caches preflight requests for 24 hours

This configuration is applied consistently across all API routes through the use of utility functions that inject these headers into responses.

```mermaid
flowchart TD
A["CORS Configuration Sources"] --> B["Utility Functions (lib/utils/http.ts)"]
A --> C["Next.js Configuration (next.config.ts)"]
A --> D["Vercel Platform (vercel.json)"]
B --> E["CORS_HEADERS constant"]
B --> F["createOptionsHandler function"]
C --> G["Global headers configuration"]
D --> H["CDN-level headers"]
E --> I["Applied to API responses"]
F --> J["OPTIONS route handler"]
G --> I
H --> I
```

**Diagram sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [next.config.ts](file://next.config.ts#L10-L28)
- [vercel.json](file://vercel.json#L3-L25)

**Section sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [next.config.ts](file://next.config.ts#L10-L28)
- [vercel.json](file://vercel.json#L3-L25)

## Supported Methods and Headers
The CORS implementation supports a comprehensive set of HTTP methods and request headers to accommodate various API interactions. The configuration enables full CRUD operations through the API endpoints.

### Supported HTTP Methods
The following methods are explicitly allowed in the CORS policy:
- GET - Retrieve resources
- POST - Create resources or process data
- PUT - Update resources
- DELETE - Remove resources
- OPTIONS - Preflight requests

This broad method support enables rich client-server interactions while maintaining security through proper authentication and authorization mechanisms at the application level.

### Allowed Request Headers
The implementation permits the following headers in client requests:
- `Content-Type` - Required for proper payload interpretation
- `Authorization` - Enables authenticated requests with tokens
- `X-Requested-With` - Commonly used to identify AJAX requests

These headers were selected to support typical web application patterns while minimizing potential security risks. The `Content-Type` header is essential for JSON payload processing, while `Authorization` enables secure access control. The `X-Requested-With` header is included for compatibility with various client-side frameworks and libraries.

```mermaid
classDiagram
class CORSConfig {
+string Access-Control-Allow-Origin : "*"
+string Access-Control-Allow-Methods : "GET, POST, PUT, DELETE, OPTIONS"
+string Access-Control-Allow-Headers : "Content-Type, Authorization, X-Requested-With"
+string Access-Control-Max-Age : "86400"
}
class SupportedMethods {
+GET : Retrieve resources
+POST : Create resources
+PUT : Update resources
+DELETE : Remove resources
+OPTIONS : Preflight requests
}
class AllowedHeaders {
+Content-Type : Payload format
+Authorization : Authentication tokens
+X-Requested-With : AJAX identification
}
CORSConfig --> SupportedMethods : "includes"
CORSConfig --> AllowedHeaders : "includes"
```

**Diagram sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [next.config.ts](file://next.config.ts#L10-L28)

**Section sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [next.config.ts](file://next.config.ts#L10-L28)

## Preflight Request Handling
The system implements robust handling of preflight (OPTIONS) requests through a dedicated handler function that ensures proper response to browser preflight checks.

### OPTIONS Handler Implementation
The `createOptionsHandler` function in `lib/utils/http.ts` returns a properly structured handler function that generates the appropriate response for preflight requests. This implementation was corrected from an initial version that returned a `NextResponse` object directly, which was incompatible with Next.js routing requirements.

The handler returns a `200 OK` response with the standard CORS headers, allowing the browser to proceed with the actual request. This function is exported as `OPTIONS` in API route files to ensure it is properly registered with the Next.js router.

### Preflight Caching
The configuration includes `Access-Control-Max-Age: 86400`, which instructs browsers to cache preflight responses for 24 hours. This optimization reduces the number of preflight requests and improves application performance by eliminating the need for repeated OPTIONS requests to the same endpoint within the caching period.

```mermaid
sequenceDiagram
participant Browser
participant Server
participant API
Browser->>Server : OPTIONS /api/persona/block
activate Browser
Server->>API : Route to OPTIONS handler
activate Server
API->>API : createOptionsHandler()
API->>Server : 200 OK + CORS headers
deactivate API
Server->>Browser : 200 OK + CORS headers
deactivate Server
Browser->>Server : POST /api/persona/block (actual request)
Server->>API : Process POST request
API->>Server : Response with CORS headers
Server->>Browser : Response with CORS headers
deactivate Browser
Note over Browser,Server : Preflight check passes<br/>Actual request proceeds
```

**Diagram sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L69-L76)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L141-L141)

**Section sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L69-L76)
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts#L141-L141)

## Security Considerations
The CORS implementation balances accessibility with security considerations, particularly regarding the use of wildcard origins and header restrictions.

### Wildcard Origin Policy
The current configuration uses `Access-Control-Allow-Origin: *`, which permits requests from any domain. This is appropriate for a public API but represents a security consideration that should be evaluated based on the application's requirements. The wildcard policy enables broad integration capabilities but should be monitored for potential abuse.

If domain-specific restrictions are required in the future, the configuration can be updated to specify particular origins, such as `https://shkolamasterov.online`, which would limit API access to that specific domain.

### Header Security
The allowed headers are carefully selected to minimize security risks:
- `Content-Type` is restricted to standard values through application-level validation
- `Authorization` headers are processed securely with token validation
- No permissive headers like `Access-Control-Allow-Credentials` are enabled

The implementation avoids common security pitfalls such as reflecting the `Origin` header in responses or allowing excessive headers that could be exploited in attacks.

### Future Security Enhancements
Potential security improvements include:
- Implementing origin-specific restrictions instead of wildcard
- Adding rate limiting for preflight requests
- Implementing more granular header controls based on endpoint requirements
- Adding logging for cross-origin request patterns

```mermaid
flowchart TD
A["Security Considerations"] --> B["Current Implementation"]
A --> C["Potential Risks"]
A --> D["Future Enhancements"]
B --> B1["Wildcard origin (*)"]
B --> B2["Limited allowed headers"]
B --> B3["No credentials support"]
C --> C1["Potential abuse from any domain"]
C --> C2["Lack of origin validation"]
C --> C3["DDoS via preflight requests"]
D --> D1["Origin-specific restrictions"]
D --> D2["Rate limiting"]
D --> D3["Enhanced logging"]
D --> D4["Granular header controls"]
style B1 fill:#d4edda,stroke:#c3e6cb
style C1 fill:#f8d7da,stroke:#f5c6cb
style D1 fill:#d1ecf1,stroke:#bee5eb
```

**Diagram sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md#L295-L301)

**Section sources**
- [lib/utils/http.ts](file://lib/utils/http.ts#L6-L11)
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md#L295-L301)

## Client-Side Implementation Examples
The following examples demonstrate proper client-side implementation for interacting with the CORS-enabled API endpoints.

### JavaScript Fetch Example
```javascript
// POST request to persona/block endpoint
fetch('https://pesonalisev2-zxby.vercel.app/api/persona/block', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-if-required'
  },
  body: JSON.stringify({
    user_id: '21179358',
    lesson: '1',
    title: 'Урок 1'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  // Handle the personalized HTML content
  document.getElementById('lesson-container').innerHTML = data.html;
})
.catch(error => {
  console.error('Error:', error);
});
```

### Handling API Responses
When processing responses from the API, clients should check the `ok` field in the response to determine success:

```javascript
if (response.ok) {
  // Process successful response
  if (response.html) {
    // Display personalized content
    displayPersonalizedContent(response.html);
  }
} else {
  // Handle error
  showError(response.error || 'Unknown error occurred');
}
```

### Error Handling
Proper error handling should account for both network errors and API-level errors:

```javascript
async function fetchPersonalizedBlock(userId, lesson) {
  try {
    const response = await fetch('/api/persona/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, lesson: lesson })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch personalized content:', error);
    // Provide fallback content or error message
    return { ok: false, error: error.message };
  }
}
```

**Section sources**
- [app/api/persona/block/route.ts](file://app/api/persona/block/route.ts)
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md#L238-L294)

## Deployment and CDN Configuration
The CORS implementation includes configuration at the deployment and CDN levels to ensure headers are properly delivered in production environments.

### Vercel Configuration
The `vercel.json` file contains CDN-level headers configuration that applies CORS headers at the edge network. This ensures that headers are present even before requests reach the application server:

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        }
      ]
    }
  ]
}
```

### Next.js Configuration
The `next.config.ts` file includes a headers function that configures CORS headers for all API routes during server-side rendering:

```typescript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization, X-Requested-With"
        },
        {
          key: "Access-Control-Max-Age",
          value: "86400"
        }
      ]
    }
  ];
}
```

This dual-layer approach ensures consistent header delivery regardless of whether requests are handled at the CDN level or by the application server.

```mermaid
graph TB
A["Client Request"] --> B["Vercel CDN"]
B --> C{"Is it an API route?"}
C --> |Yes| D["Add CORS headers at CDN level"]
C --> |No| E["Serve static content"]
D --> F["Application Server"]
F --> G["Add CORS headers at application level"]
G --> H["Return response with CORS headers"]
E --> H
H --> I["Client"]
style D fill:#cce5ff,stroke:#b8daff
style G fill:#d4edda,stroke:#c3e6cb
```

**Diagram sources**
- [vercel.json](file://vercel.json#L3-L25)
- [next.config.ts](file://next.config.ts#L10-L28)

**Section sources**
- [vercel.json](file://vercel.json#L3-L25)
- [next.config.ts](file://next.config.ts#L10-L28)

## Testing and Validation
The CORS implementation has been thoroughly tested using various methods to ensure proper functionality across different scenarios.

### Local Testing
During development, the implementation was validated using curl commands to test both preflight and actual requests:

```bash
# Test OPTIONS preflight request
curl -i -X OPTIONS http://localhost:3000/api/persona/block

# Test POST request with Origin header
curl -i -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -H "Origin: https://shkolamasterov.online" \
  -d '{"user_id":"test_user","lesson":"1","title":"Урок 1"}'
```

### Production Verification
After deployment, similar tests should be conducted against the production endpoint to verify that CORS headers are properly delivered:

```bash
# Verify production OPTIONS response
curl -i -X OPTIONS https://pesonalisev2-zxby.vercel.app/api/persona/block

# Verify production POST response
curl -i -X POST https://pesonalisev2-zxby.vercel.app/api/persona/block \
  -H "Content-Type: application/json" \
  -H "Origin: https://shkolamasterov.online" \
  -d '{"user_id":"21179358","lesson":"1","title":"Урок 1"}'
```

### Expected Response Headers
Successful responses should include the following CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400
```

Monitoring of Vercel logs is also recommended to detect any CORS-related issues in production:
```bash
vercel logs --follow
```

**Section sources**
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md#L238-L294)

## Conclusion
The CORS implementation provides a robust solution for enabling cross-origin API access while maintaining security and performance. The multi-layered approach ensures consistent header delivery across development, staging, and production environments.

Key aspects of the implementation include:
- Centralized CORS configuration in utility functions
- Proper handling of preflight (OPTIONS) requests
- Support for multiple HTTP methods and essential headers
- CDN-level configuration for improved performance
- Comprehensive testing procedures

The current configuration with wildcard origin (`*`) enables broad integration capabilities suitable for a public API. Future enhancements could include more restrictive origin policies, rate limiting, and enhanced monitoring if required by evolving security requirements.

The implementation has been validated locally and is ready for production deployment, with clear procedures for post-deployment verification to ensure continued proper functionality.

**Section sources**
- [CORS_FIX_REPORT.md](file://CORS_FIX_REPORT.md#L295-L301)