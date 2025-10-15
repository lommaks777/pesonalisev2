# Component Hierarchy and Structure

<cite>
**Referenced Files in This Document**   
- [profile-selector.tsx](file://components/profiles/profile-selector.tsx)
- [personalization-editor.tsx](file://components/personalizations/personalization-editor.tsx)
- [button.tsx](file://components/ui/button.tsx)
- [card.tsx](file://components/ui/card.tsx)
- [input.tsx](file://components/ui/input.tsx)
- [textarea.tsx](file://components/ui/textarea.tsx)
- [badge.tsx](file://components/ui/badge.tsx)
- [scroll-area.tsx](file://components/ui/scroll-area.tsx)
- [separator.tsx](file://components/ui/separator.tsx)
- [theme-provider.tsx](file://components/theme-provider.tsx)
- [route.ts](file://app/api/personalizations/route.ts)
- [profiles.ts](file://lib/api/profiles.ts)
- [personalizations.ts](file://lib/api/personalizations.ts)
- [page.tsx](file://app/(dashboard)/dashboard/page.tsx)
- [page.tsx](file://app/(dashboard)/profile/[profileId]/page.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Domain-Specific Components](#domain-specific-components)
3. [UI Component Library](#ui-component-library)
4. [Theme Provider Implementation](#theme-provider-implementation)
5. [Component Composition and Best Practices](#component-composition-and-best-practices)
6. [Accessibility and Responsive Design](#accessibility-and-responsive-design)
7. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive overview of the component hierarchy in the Persona application. It details domain-specific components such as ProfileSelector and PersonalizationEditor, explains the UI component library built on Radix primitives and styled with Tailwind CSS, and covers the theme provider implementation for dark/light mode toggling. The documentation also includes guidance on component composition, accessibility features, and responsive design patterns.

## Domain-Specific Components

### ProfileSelector
The `ProfileSelector` component enables users to select a user profile from a list, updating the URL query parameter to reflect the active profile. It receives a list of profiles as a prop and renders them as clickable items. When a profile is selected, it updates the `profileId` search parameter via the Next.js router, triggering a re-render of dependent components that fetch profile-specific data.

The component uses `useRouter` and `useSearchParams` hooks to manage navigation and query state. Each profile item displays the user's name or identifier and associated course slug. A link to the individual profile management page is provided below each entry.

**Section sources**
- [profile-selector.tsx](file://components/profiles/profile-selector.tsx#L12-L65)
- [page.tsx](file://app/(dashboard)/dashboard/page.tsx#L45-L50)

### PersonalizationEditor
The `PersonalizationEditor` component allows administrators to create, edit, and delete personalized lesson content for a specific user profile. It accepts props including `profileId`, `lessonId`, `lessonTitle`, and `initialContent`. The editor provides a JSON textarea for content input, with validation and formatting support.

State management is handled using React's `useState` hook for content, loading status, and feedback messages. On save, the component sends a POST request to `/api/personalizations` with the updated JSON content. Deletion is confirmed via a browser dialog before issuing a DELETE request to the same endpoint.

Success and error messages are displayed inline after API interactions. The editor supports real-time JSON editing and provides immediate visual feedback during loading states.

**Section sources**
- [personalization-editor.tsx](file://components/personalizations/personalization-editor.tsx#L12-L154)
- [page.tsx](file://app/(dashboard)/profile/[profileId]/page.tsx#L78-L86)
- [route.ts](file://app/api/personalizations/route.ts#L1-L134)

### API Integration
The `PersonalizationEditor` interacts with the `/api/personalizations` endpoint, which handles both creation and updating of personalized lesson descriptions in the Supabase database. The POST method either inserts a new record or updates an existing one based on the presence of a matching `profile_id` and `lesson_id`. The DELETE method removes a personalization entry.

A separate GET endpoint at `/api/profiles/[profileId]/personalizations` retrieves all personalizations for a given profile, used to pre-fill the editor interface.

**Section sources**
- [route.ts](file://app/api/personalizations/route.ts#L1-L134)
- [route.ts](file://app/api/profiles/[profileId]/personalizations/route.ts#L1-L32)
- [personalizations.ts](file://lib/api/personalizations.ts#L1-L28)

## UI Component Library

The UI component library is built using Radix UI primitives and styled with Tailwind CSS utility classes. All components are designed for accessibility, responsiveness, and consistent theming.

### Button
The `Button` component is a versatile, accessible button with multiple variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`). It uses `cva` for variant management and supports `asChild` rendering via Radix's `Slot`.

**Section sources**
- [button.tsx](file://components/ui/button.tsx#L1-L60)

### Card
The `Card` component provides a structured container with header, title, description, action, content, and footer sections. It uses a grid layout for alignment and supports responsive behavior through container queries.

**Section sources**
- [card.tsx](file://components/ui/card.tsx#L1-L92)

### Input and Textarea
Both `Input` and `Textarea` components are styled with consistent focus rings, error states, and disabled styles. They support accessibility attributes and integrate with form validation via `aria-invalid`.

**Section sources**
- [input.tsx](file://components/ui/input.tsx#L1-L21)
- [textarea.tsx](file://components/ui/textarea.tsx#L1-L18)

### Badge
The `Badge` component displays small labels with semantic variants (`default`, `secondary`, `destructive`, `outline`). It supports icons and links via the `asChild` prop.

**Section sources**
- [badge.tsx](file://components/ui/badge.tsx#L1-L46)

### ScrollArea and Separator
`ScrollArea` wraps Radix's scroll area primitive with custom scrollbars, enabling smooth scrolling in constrained containers. `Separator` renders a thin divider line, available in horizontal and vertical orientations.

**Section sources**
- [scroll-area.tsx](file://components/ui/scroll-area.tsx#L1-L58)
- [separator.tsx](file://components/ui/separator.tsx#L1-L28)

## Theme Provider Implementation

The `ThemeProvider` component wraps Next.js's `next-themes` provider, enabling dynamic light and dark mode switching. It uses the system preference by default and persists user selection in localStorage.

The implementation is minimal, serving as a bridge between the Next.js theme context and the application's component tree. No custom styling or logic is applied within the component itself.

**Section sources**
- [theme-provider.tsx](file://components/theme-provider.tsx#L1-L11)

## Component Composition and Best Practices

Components are composed following modular design principles. Domain-specific components like `ProfileSelector` and `PersonalizationEditor` are built using atomic UI primitives (Button, Card, Input, etc.), ensuring consistency and reusability.

Best practices include:
- Using `cn()` for conditional class composition
- Leveraging Radix primitives for accessible interactions
- Managing state locally within components unless shared
- Validating inputs before API submission
- Providing user feedback for async operations

Example composition: The `PersonalizationEditor` uses `Card` for layout, `Textarea` for JSON input, and `Button` for actions, all styled consistently via the UI library.

**Section sources**
- [personalization-editor.tsx](file://components/personalizations/personalization-editor.tsx#L12-L154)
- [profile-selector.tsx](file://components/profiles/profile-selector.tsx#L12-L65)

## Accessibility and Responsive Design

All components are designed with accessibility in mind:
- Semantic HTML elements are used throughout
- Focus indicators are visible and enhanced
- ARIA attributes are applied where necessary
- Color contrast meets WCAG standards
- Keyboard navigation is supported via Radix primitives

Responsive design patterns include:
- Fluid grid layouts using Tailwind's flex and grid utilities
- Responsive text sizing with `md:text-sm`
- Mobile-friendly padding and spacing
- Scrollable containers on smaller screens

The `ScrollArea` component ensures content remains accessible on mobile devices by enabling overflow scrolling.

**Section sources**
- [button.tsx](file://components/ui/button.tsx#L1-L60)
- [card.tsx](file://components/ui/card.tsx#L1-L92)
- [scroll-area.tsx](file://components/ui/scroll-area.tsx#L1-L58)

## Conclusion
The component hierarchy in the Persona application is well-structured, leveraging Radix UI for accessibility and Tailwind CSS for consistent styling. Domain-specific components like `ProfileSelector` and `PersonalizationEditor` provide critical functionality with clean API integrations, while the reusable UI library ensures visual and behavioral consistency across the application. The theme provider enables user preference persistence, and all components adhere to accessibility and responsive design standards.