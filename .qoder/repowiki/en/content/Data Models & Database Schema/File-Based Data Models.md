# File-Based Data Models

<cite>
**Referenced Files in This Document**   
- [user_profiles.json](file://store/user_profiles.json)
- [course.json](file://store/shvz/course.json)
- [lesson.json](file://store/shvz/lessons/01/lesson.json)
- [course_quiz.json](file://store/shvz/course_quiz.json)
- [videos_list.json](file://store/shvz/videos_list.json)
- [regenerate-lesson-templates.ts](file://scripts/regenerate-lesson-templates.ts)
</cite>

## Table of Contents
1. [User Profile Model](#user-profile-model)
2. [Course Structure Model](#course-structure-model)
3. [Lesson Template Model](#lesson-template-model)
4. [Quiz Assessment Model](#quiz-assessment-model)
5. [Video Media Mapping](#video-media-mapping)
6. [Template Personalization Workflow](#template-personalization-workflow)
7. [Runtime Resolution and Fallback](#runtime-resolution-and-fallback)
8. [Versioning and Update Mechanisms](#versioning-and-update-mechanisms)

## User Profile Model

The `user_profiles.json` file serves as the central repository for user persona data, capturing both explicit survey responses and derived attributes used for personalization. Each user is uniquely identified by a `user_id` and contains structured information about their background, motivations, fears, and goals.

Key fields include:
- **user_identifier**: Unique ID in format `user_timestamp_randomhex`
- **name**: User's first name
- **course**: Enrolled course name
- **created_at**: Timestamp of profile creation
- **experience**: Prior experience level (e.g., "self_taught")
- **motivation**: Array of primary motivations (e.g., "new_profession", "extra_income")
- **target_clients**: Desired client demographic
- **skills_wanted**: Desired skill outcomes
- **fears**: Array of concerns (e.g., "technique_fail", "no_clients")
- **wow_result**: Specific success metric desired
- **practice_model**: Who the user practices on
- **skill_level**: Self-assessed proficiency
- **goals**: Derived from skills_wanted, used for personalization
- **problems**: Comma-separated string of fears, used in content adaptation
- **available_time**: Daily time commitment

Derived attributes like `goals` and `problems` are automatically generated from survey responses to streamline personalization logic. The model supports both structured arrays and free-text fields, with consistent naming conventions using snake_case.

Sample user profile:
```json
{
  "user_id": "user_1757557358_46fc98ea",
  "name": "Алексей",
  "course": "Массаж ШВЗ",
  "motivation": ["new_profession", "extra_income"],
  "target_clients": "Женщины 40+",
  "fears": ["technique_fail", "no_clients"],
  "goals": "выполнять правильный и эффективный массаж...",
  "problems": "technique_fail, no_clients"
}
```

**Section sources**
- [user_profiles.json](file://store/user_profiles.json#L1-L270)

## Course Structure Model

The `course.json` file defines the metadata and structural organization of the course. It contains high-level information about the course and specifies the sequence of lessons.

Structure includes:
- **name**: Course title ("Массаж ШВЗ")
- **description**: Brief course description
- **lessons**: Array of lesson numbers in sequence [1, 2, 3, ..., 12]
- **total_lessons**: Total count of lessons (12)
- **created_at**: Course creation date
- **status**: Publication status ("active")

This model serves as the master blueprint for course navigation and progression tracking. The `lessons` array explicitly defines the learning path, ensuring consistent sequencing across all users. The file acts as a single source of truth for course structure, referenced by various components including the API routes and personalization engine.

```json
{
  "name": "Массаж ШВЗ",
  "description": "Курс по массажу шейно-воротниковой зоны",
  "lessons": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "total_lessons": 12,
  "created_at": "2024-10-08",
  "status": "active"
}
```

**Section sources**
- [course.json](file://store/shvz/course.json#L1-L10)

## Lesson Template Model

Lesson templates in the `store/shvz/lessons/` directory define the metadata for each lesson. Each lesson has a dedicated `lesson.json` file containing basic information.

The lesson metadata structure includes:
- **number**: Lesson number (1-12)
- **title**: Lesson title
- **description**: Detailed lesson description
- **duration**: Estimated completion time
- **status**: Publication status ("active")
- **created_at**: Creation timestamp

These templates serve as the foundation for lesson personalization, providing the context needed to generate AI-enhanced content. The files are organized in numbered directories (01, 02, etc.) for clear sequencing.

Example lesson.json:
```json
{
    "number": 1,
    "title": "Урок введение.",
    "description": "Урок введение.",
    "duration": "6 минут",
    "status": "active",
    "created_at": "2024-10-08"
}
```

The lesson numbering in the files does not follow sequential order, indicating that the actual sequence is determined by the course.json file rather than directory naming.

**Section sources**
- [lesson.json](file://store/shvz/lessons/01/lesson.json#L1-L8)
- [lesson.json](file://store/shvz/lessons/02/lesson.json#L1-L8)
- [lesson.json](file://store/shvz/lessons/03/lesson.json#L1-L8)
- [lesson.json](file://store/shvz/lessons/04/lesson.json#L1-L8)
- [lesson.json](file://store/shvz/lessons/05/lesson.json#L1-L8)

## Quiz Assessment Model

The `course_quiz.json` file contains assessment questions for each lesson, structured to validate user understanding of key concepts. Each quiz entry is associated with a specific lesson through its `lesson_id`.

Structure includes:
- **lesson_id**: Unique identifier for the lesson
- **title**: Lesson title/transcript
- **questions**: Array of multiple-choice questions
  - **question**: The assessment question
  - **options**: Array of possible answers
  - **correct_index**: Index of the correct answer

The quiz data is extensive, containing detailed transcripts of lesson content along with assessment questions. This serves dual purposes: providing context for AI processing and enabling knowledge validation. The questions are designed to test comprehension of critical techniques, safety considerations, and theoretical concepts covered in each lesson.

Each lesson has 3 assessment questions with 3 possible answers, following a consistent format across all lessons. The quiz data appears to be generated from video transcripts, with the full lesson content included in the `title` field.

**Section sources**
- [course_quiz.json](file://store/shvz/course_quiz.json#L1-L201)

## Video Media Mapping

The `videos_list.json` file maps lesson content to actual video resources, serving as the media catalog for the course. This file connects abstract lesson concepts with concrete video assets.

Fields include:
- **id**: Unique video identifier (UUID format)
- **title**: Video title
- **duration**: Length in seconds
- **status**: Processing status ("done")
- **url**: Kinescope video URL
- **created_at**: Upload timestamp
- **updated_at**: Last modification timestamp

This mapping enables dynamic resolution of video content based on lesson requirements. The video IDs are used to generate consistent filenames for lesson templates and transcripts, ensuring traceability across the content pipeline.

Example video mapping:
```json
{
  "id": "f9b62dc5-9b76-491d-8b9b-2b72411df740",
  "title": "1 Урок Демонстрация",
  "duration": 1994.9192,
  "status": "done",
  "url": "https://kinescope.io/f9b62dc5-9b76-491d-8b9b-2b72411df740"
}
```

The video list contains entries for all 12 lessons, with durations ranging from approximately 9 to 50 minutes, reflecting the varying complexity of lesson content.

**Section sources**
- [videos_list.json](file://store/shvz/videos_list.json#L1-L121)

## Template Personalization Workflow

Lesson templates are enhanced through an AI-driven personalization process that merges static templates with dynamic user data. The workflow begins with raw lesson templates in the `lessons/` directory and combines them with video transcripts and user profiles to create personalized learning experiences.

The personalization process generates JSON templates with the following key fields:
- **summary_short**: Brief lesson overview
- **why_watch**: Benefits and importance of the lesson
- **quick_action**: Immediate actionable step
- **social_share**: Social media sharing message
- **homework_20m**: 20-minute homework assignment with step-by-step instructions

These fields are populated by the `regenerate-lesson-templates.ts` script using OpenAI's GPT-4o model. The AI processes video transcripts to extract key information and reformulates it into structured, actionable content that can be personalized based on user profiles.

The personalization engine uses user attributes like `goals`, `problems`, and `skill_level` to adapt content tone and focus. For example, users with "technique_fail" as a fear receive more detailed technical guidance, while those seeking "extra_income" get additional business-oriented advice.

The output templates follow a strict JSON schema to ensure consistency across lessons and simplify integration with the frontend application.

**Section sources**
- [regenerate-lesson-templates.ts](file://scripts/regenerate-lesson-templates.ts#L1-L310)

## Runtime Resolution and Fallback

At runtime, the application resolves lesson content through a hierarchical lookup system that prioritizes personalized content while maintaining fallback mechanisms. The resolution process follows this order:

1. Check for personalized lesson content specific to the user
2. Fall back to AI-generated lesson templates
3. Use basic lesson metadata as last resort

The API routes in `app/api/lessons/route.ts` and `app/api/persona/personalize-template/route.ts` handle this resolution logic, merging user profile data with lesson templates to deliver customized content. The system uses the lesson number and user ID to identify the appropriate content files.

When personalized content is not available, the system serves the generic AI-generated template. If even the AI template is unavailable, the basic lesson metadata from the `lessons/` directory is used to construct a minimal lesson view.

This multi-layered approach ensures that users always receive relevant content while allowing for progressive enhancement as more personalized materials become available.

The fallback mechanism is critical for maintaining course continuity during content updates and ensuring that new users can access materials immediately without waiting for full personalization processing.

**Section sources**
- [regenerate-lesson-templates.ts](file://scripts/regenerate-lesson-templates.ts#L1-L310)

## Versioning and Update Mechanisms

The system employs a comprehensive versioning strategy using backup files and automated regeneration scripts to manage content updates. The `regenerate-lesson-templates.ts` script serves as the primary tool for updating lesson content, following a systematic process:

1. Read lesson metadata from `lessons/` directory
2. Load video transcript from store directory
3. Generate new template using OpenAI API
4. Create backup of existing template
5. Save new template with standardized naming

The script implements a robust naming convention: `{number}-{id}-final.json`, where the ID comes from a predefined mapping in the script. Before overwriting existing files, it creates backup copies with `-backup.json` suffix, preserving previous versions.

The versioning system includes:
- Automatic backup creation before updates
- Consistent filename patterns for easy identification
- Timestamp preservation through creation dates
- Error handling to prevent data loss during failures
- Sequential processing with 1-second delays between requests

The update workflow is designed to be idempotent, allowing safe re-execution without creating duplicate backups or corrupting data. Success and error counts are logged to provide visibility into the update process.

This systematic approach ensures content integrity while enabling efficient updates to the entire lesson library. The separation of concerns—metadata in structured JSON files, video content in external hosting, and AI-generated templates in standardized formats—creates a maintainable content pipeline.

**Section sources**
- [regenerate-lesson-templates.ts](file://scripts/regenerate-lesson-templates.ts#L1-L310)