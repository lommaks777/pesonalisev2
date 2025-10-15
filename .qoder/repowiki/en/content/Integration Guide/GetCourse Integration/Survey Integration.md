# Survey Integration

<cite>
**Referenced Files in This Document**   
- [GETCOURSE_HTML_CODES.md](file://GETCOURSE_HTML_CODES.md)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md)
- [app/survey/iframe/page.tsx](file://app/survey/iframe/page.tsx)
- [app/api/survey/route.ts](file://app/api/survey/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Embedding the Survey Iframe](#embedding-the-survey-iframe)
3. [User Data Pre-filling](#user-data-pre-filling)
4. [Post-Message Event Flow](#post-message-event-flow)
5. [Handling Survey Completion in GetCourse](#handling-survey-completion-in-getcourse)
6. [Responsive Design and Mobile Considerations](#responsive-design-and-mobile-considerations)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Introduction
This document provides comprehensive instructions for integrating the persona survey with GetCourse. It covers embedding the survey iframe, pre-filling user data, handling post-message events upon survey completion, and implementing responsive design for optimal user experience across devices. The integration enables personalized course content generation based on user responses, with proper security measures and error handling.

## Embedding the Survey Iframe
To embed the persona survey in GetCourse, use the provided HTML template from GETCOURSE_HTML_CODES.md. The recommended approach uses the clean iframe version of the survey form:

```html
<div style="max-width:900px;margin:40px auto;padding:20px;">
  <h2 style="text-align:center;color:#667eea;margin-bottom:20px;">
    🎯 Personalization of Your Course
  </h2>
  <p style="text-align:center;color:#666;margin-bottom:30px;">
    Complete a short survey to receive personalized recommendations in each lesson
  </p>
  
  <iframe 
    src="https://pesonalisev2-zxby.vercel.app/survey/iframe?uid={uid}&name={real_name}" 
    style="width:100%;height:1200px;border:0;border-radius:16px;box-shadow:0 10px 40px rgba(102,126,234,0.2);"
    allowtransparency="true">
  </iframe>
  
  <p style="text-align:center;color:#999;margin-top:20px;font-size:14px;">
    💡 Your responses are used only for personalizing lessons
  </p>
</div>
```

This code should be inserted on the first lesson page in GetCourse. The iframe is styled with rounded corners, a subtle shadow, and proper spacing to ensure it integrates seamlessly with the course design.

**Section sources**
- [GETCOURSE_HTML_CODES.md](file://GETCOURSE_HTML_CODES.md)

## User Data Pre-filling
The survey supports pre-filling user data using URL parameters. The `{uid}` and `{real_name}` placeholders from GetCourse are automatically substituted with the actual user values when the page loads.

In the implementation, the `SurveyIframePage` component retrieves these parameters using Next.js's `useSearchParams()` hook:

```typescript
const searchParams = useSearchParams();
const uidParam = searchParams.get("uid");
const nameParam = searchParams.get("name");
```

The component initializes its form state with these values, automatically populating the user's name if provided. This creates a seamless experience where returning users don't need to re-enter their information. The `uid` parameter is particularly important as it serves as the user identifier that links the survey responses to the user's profile in the database.

**Section sources**
- [app/survey/iframe/page.tsx](file://app/survey/iframe/page.tsx#L16-L282)

## Post-Message Event Flow
Upon successful survey completion, the iframe sends a post-message event to its parent window (GetCourse) with the user's profile information. This event contains critical data needed for subsequent processing.

The event is dispatched from the survey iframe after a successful API call to `/api/survey`:

```typescript
if (window.parent !== window) {
  window.parent.postMessage({
    type: "SURVEY_COMPLETED",
    profileId: data.profileId,
    userIdentifier: data.userIdentifier,
    dashboardUrl: dashboardUrl,
  }, "*");
}
```

The message payload includes:
- **type**: Event identifier ("SURVEY_COMPLETED")
- **profileId**: Unique UUID for the user's profile
- **userIdentifier**: User identifier (GetCourse UID or guest ID)
- **dashboardUrl**: Direct link to the personalized dashboard

This event-driven architecture enables communication between the isolated iframe and the parent GetCourse page, allowing for dynamic responses to survey completion without page reloads.

**Section sources**
- [app/survey/iframe/page.tsx](file://app/survey/iframe/page.tsx#L47-L96)

## Handling Survey Completion in GetCourse
To handle the SURVEY_COMPLETED event in GetCourse, implement an event listener on the parent window that processes the message and takes appropriate action.

```javascript
window.addEventListener('message', function(event) {
  // Validate message origin for security
  if (event.origin !== 'https://pesonalisev2-zxby.vercel.app') {
    return;
  }
  
  if (event.data.type === 'SURVEY_COMPLETED') {
    const profileId = event.data.profileId;
    const userIdentifier = event.data.userIdentifier;
    const dashboardUrl = event.data.dashboardUrl;
    
    // Log completion for debugging
    console.log('Profile created:', profileId);
    console.log('Dashboard link:', dashboardUrl);
    
    // Option 1: Redirect user to personalized dashboard
    window.location.href = dashboardUrl;
    
    // Option 2: Display personalized link to user
    // document.getElementById('dashboard-link').href = dashboardUrl;
    // document.getElementById('dashboard-section').style.display = 'block';
  }
});
```

This event handler should be included on the same page as the iframe. It first validates the message origin to prevent security vulnerabilities, then extracts the relevant data from the event payload. After survey completion, you can either redirect the user to their personalized dashboard or display a personalized link/button for them to access their content.

**Section sources**
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L40-L89)

## Responsive Design and Mobile Considerations
To ensure optimal display across devices, implement responsive styling for the survey iframe. The height requirement differs between desktop and mobile devices due to varying screen dimensions and form layout.

For desktop devices, use a height of 1200px, while mobile devices require 1400px to accommodate the full form without scrolling issues:

```css
@media (max-width: 768px) {
  iframe {
    height: 1400px;
  }
}
```

The adaptive approach wraps the iframe in a responsive container:

```html
<div style="max-width: 900px; margin: 0 auto;">
  <iframe 
    src="https://pesonalisev2-zxby.vercel.app/survey/iframe"
    width="100%"
    height="1200"
    frameborder="0"
    style="border: none; border-radius: 12px;"
    title="Course Personalization Survey"
  ></iframe>
</div>
```

This ensures the survey is centered on larger screens and scales appropriately on smaller devices. The combination of CSS media queries and proper container styling provides an optimal user experience across all device types.

**Section sources**
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L40-L89)

## Security Considerations
Security is paramount when implementing cross-origin communication between the survey iframe and GetCourse. Several measures should be implemented to prevent potential vulnerabilities.

First, always validate the message origin in the event listener:

```javascript
if (event.origin !== 'https://pesonalisev2-zxby.vercel.app') {
  return;
}
```

This prevents malicious sites from spoofing survey completion events. Only messages from the trusted survey domain should be processed.

Second, the server-side endpoint `/api/survey` implements proper validation:

```typescript
if (!surveyData.real_name || !surveyData.course) {
  return NextResponse.json(
    { error: "Name and course are required" },
    { status: 400 }
  );
}
```

This ensures that essential data is present before processing. Additionally, the system uses unique UUIDs for profile identifiers, making them difficult to guess and preventing unauthorized access to user data. The `uid` parameter from GetCourse is used to associate survey responses with specific users, creating a secure link between the two systems.

**Section sources**
- [app/api/survey/route.ts](file://app/api/survey/route.ts#L20-L117)

## Troubleshooting Guide
This section addresses common issues encountered during survey integration and provides solutions.

### Iframe Loading Failures
If the iframe fails to load:
1. Verify the URL is correct: `https://pesonalisev2-zxby.vercel.app/survey/iframe`
2. Check that your browser allows third-party cookies and iframes
3. Ensure your ad blocker or privacy extension isn't blocking the content
4. Confirm the service is operational by visiting the URL directly

### Blocked Scripts
If JavaScript is blocked:
1. Check that your GetCourse settings allow external scripts
2. Verify that Content Security Policy (CSP) headers aren't restricting script execution
3. Ensure the `allowtransparency` attribute is present in the iframe tag
4. Test in different browsers to isolate the issue

### Missing User Data Propagation
If user data isn't pre-filled:
1. Confirm that `{uid}` and `{real_name}` placeholders are correctly included in the URL
2. Verify that these fields are available in your GetCourse user profile
3. Check the browser console for JavaScript errors related to parameter parsing
4. Test with a known user to ensure the values are being passed correctly

### Event Handling Issues
If the SURVEY_COMPLETED event isn't received:
1. Verify the event listener is properly attached to the window object
2. Check the browser console for security warnings about cross-origin communication
3. Confirm the message origin matches exactly (including protocol)
4. Test the event flow using browser developer tools to monitor message passing

**Section sources**
- [app/survey/iframe/page.tsx](file://app/survey/iframe/page.tsx#L47-L96)
- [GETCOURSE_INTEGRATION.md](file://GETCOURSE_INTEGRATION.md#L40-L89)