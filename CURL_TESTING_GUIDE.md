# EngBee Backend - Comprehensive API Testing Guide with cURL

**Date**: December 6, 2025
**Last Updated**: December 8, 2025
**API Base URL**: `http://localhost:3000/api`

> ⚠️ **IMPORTANT FIX**: Enum values in Prompts and Attempts must be lowercase (e.g., `"speaking"`, not `"SPEAKING"`, and `"medium"`, not `"INTERMEDIATE"`). See Prompt Management section for details.

---

## Table of Contents

1. [Auth Module](#auth-module)
2. [User Management](#user-management)
3. [Class Management](#class-management)
4. [Prompt Management](#prompt-management)
5. [Assignment Management](#assignment-management)
6. [Attempt Management](#attempt-management)
7. [Attempt Media Management](#attempt-media-management)
8. [Score Management](#score-management)
9. [Feedback Management](#feedback-management)
10. [AI Rule Management](#ai-rule-management)
11. [Learner Profile Management](#learner-profile-management)
12. [Export/Report Management](#exportreport-management)

---

## Prerequisites

```bash
# Install jq for JSON parsing (optional but recommended)
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
choco install jq
```

---

## Auth Module

### 1. Register User

**Endpoint**: `POST /auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "learner"
  }'
```

**Required Fields**:
- `email` (string, must be valid email format - @isEmail)
- `password` (string, minimum 6 characters - @minLength 6)
- `confirmPassword` (string, minimum 6 characters, must match password - @minLength 6)

**Optional Fields**:
- `firstName` (string)
- `lastName` (string)
- `role` (string: "learner" or "teacher", default: "learner")

**Response** (201):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid-123",
    "email": "user@example.com",
    "role": "learner",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### 2. Login User

**Endpoint**: `POST /auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Required Fields**:
- `email` (string, must be valid email format - @isEmail)
- `password` (string, minimum 6 characters - @minLength 6)

**Response** (200): Same as Register (201)

---

### 3. Refresh Token

**Endpoint**: `POST /auth/refresh`

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Required Fields**:
- `refreshToken` (string)

**Response** (200): Same as Login

---

## User Management

### 1. Create User

**Endpoint**: `POST /users`

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123",
    "role": "TEACHER",
    "uiLanguage": "EN"
  }'
```

**Required Fields**:
- `email` (string, email format)
- `password` (string, min length 6)

**Optional Fields**:
- `role` (string: "LEARNER" or "TEACHER", default: "LEARNER")
- `uiLanguage` (string: "EN", "VI", etc., default: "EN")

**Response** (201):
```json
{
  "id": "user-uuid-123",
  "email": "teacher@example.com",
  "role": "TEACHER",
  "status": "ACTIVE",
  "uiLanguage": "EN",
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get All Users

**Endpoint**: `GET /users`

```bash
curl -X GET "http://localhost:3000/api/users?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200):
```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "email": "user1@example.com",
      "role": "LEARNER",
      "status": "ACTIVE",
      "createdAt": "2024-12-06T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 50
  }
}
```

---

### 3. Get User by ID

**Endpoint**: `GET /users/{id}`

```bash
curl -X GET http://localhost:3000/api/users/user-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200):
```json
{
  "id": "user-uuid-123",
  "email": "learner@example.com",
  "role": "LEARNER",
  "status": "ACTIVE",
  "uiLanguage": "EN",
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z",
  "learnerProfile": null,
  "taughtClasses": [],
  "enrolledClasses": []
}
```

---

### 4. Get User by Email

**Endpoint**: `GET /users/by-email/{email}`

```bash
curl -X GET http://localhost:3000/api/users/by-email/learner@example.com \
  -H "Accept: application/json"
```

**Response** (200): Same as Get User by ID

---

### 5. Update User

**Endpoint**: `PUT /users/{id}`

```bash
curl -X PUT http://localhost:3000/api/users/user-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "role": "TEACHER",
    "status": "ACTIVE",
    "uiLanguage": "VI"
  }'
```

**Optional Fields**:
- `email` (string)
- `password` (string)
- `role` (string)
- `status` (string: "ACTIVE", "INACTIVE", "LOCKED")
- `uiLanguage` (string)

**Response** (200): Updated user object

---

### 6. Delete User

**Endpoint**: `DELETE /users/{id}`

```bash
curl -X DELETE http://localhost:3000/api/users/user-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 7. Get Users by Role

**Endpoint**: `GET /users/by-role/{role}`

```bash
curl -X GET http://localhost:3000/api/users/by-role/TEACHER \
  -H "Accept: application/json"
```

**Path Parameters**:
- `role` (string: "TEACHER" or "LEARNER")

**Response** (200): Array of users with specified role

---

### 8. Lock/Unlock User

**Endpoint**: `PUT /users/{id}/lock` or `PUT /users/{id}/unlock`

```bash
# Lock user
curl -X PUT http://localhost:3000/api/users/user-uuid-123/lock \
  -H "Accept: application/json"

# Unlock user
curl -X PUT http://localhost:3000/api/users/user-uuid-123/unlock \
  -H "Accept: application/json"
```

**Response** (200): Updated user object

---

## Class Management

### 1. Create Class

**Endpoint**: `POST /classes`

```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "teacher-uuid-123",
    "name": "IELTS Speaking Preparation - Batch A",
    "description": "Intensive speaking practice for IELTS exam",
    "code": "IELTS-SPK-A"
  }'
```

**Required Fields**:
- `teacherId` (string, UUID)
- `name` (string)

**Optional Fields**:
- `description` (string)
- `code` (string, unique enrollment code)

**Response** (201):
```json
{
  "id": "class-uuid-123",
  "teacherId": "teacher-uuid-123",
  "name": "IELTS Speaking Preparation - Batch A",
  "description": "Intensive speaking practice for IELTS exam",
  "code": "IELTS-SPK-A",
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get All Classes

**Endpoint**: `GET /classes`

```bash
curl -X GET "http://localhost:3000/api/classes?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200):
```json
{
  "data": [
    {
      "id": "class-uuid-123",
      "name": "IELTS Speaking Preparation - Batch A",
      "code": "IELTS-SPK-A",
      "createdAt": "2024-12-06T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

---

### 3. Get Class by ID

**Endpoint**: `GET /classes/{id}`

```bash
curl -X GET http://localhost:3000/api/classes/class-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200):
```json
{
  "id": "class-uuid-123",
  "teacherId": "teacher-uuid-123",
  "name": "IELTS Speaking Preparation - Batch A",
  "description": "Intensive speaking practice for IELTS exam",
  "code": "IELTS-SPK-A",
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 4. Get Classes by Teacher

**Endpoint**: `GET /classes/teacher/{teacherId}`

```bash
curl -X GET "http://localhost:3000/api/classes/teacher/teacher-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of teacher's classes

---

### 5. Get Class by Code

**Endpoint**: `GET /classes/code/{code}`

```bash
curl -X GET http://localhost:3000/api/classes/code/IELTS-SPK-A \
  -H "Accept: application/json"
```

**Response** (200): Class object

---

### 6. Update Class

**Endpoint**: `PUT /classes/{id}`

```bash
curl -X PUT http://localhost:3000/api/classes/class-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "IELTS Speaking Preparation - Batch B",
    "description": "Updated description",
    "code": "IELTS-SPK-B"
  }'
```

**Optional Fields**:
- `name` (string)
- `description` (string)
- `code` (string)

**Response** (200): Updated class object

---

### 7. Delete Class

**Endpoint**: `DELETE /classes/{id}`

```bash
curl -X DELETE http://localhost:3000/api/classes/class-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 8. Enroll Learner in Class

**Endpoint**: `POST /classes/{id}/enroll`

```bash
curl -X POST http://localhost:3000/api/classes/class-uuid-123/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "learner-uuid-456"
  }'
```

**Required Fields**:
- `learnerId` (string, UUID)

**Response** (200): Enrollment confirmation

---

### 9. Enroll by Code

**Endpoint**: `POST /classes/enroll-by-code/{learnerId}`

```bash
curl -X POST http://localhost:3000/api/classes/enroll-by-code/learner-uuid-456 \
  -H "Content-Type: application/json" \
  -d '{
    "code": "IELTS-SPK-A"
  }'
```

**Required Fields**:
- `code` (string)

**Response** (200): Enrollment confirmation

---

### 10. Remove Learner from Class

**Endpoint**: `POST /classes/{id}/remove-learner`

```bash
curl -X POST http://localhost:3000/api/classes/class-uuid-123/remove-learner \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "learner-uuid-456"
  }'
```

**Required Fields**:
- `learnerId` (string)

**Response** (200): Removal confirmation

---

### 11. Get Learner Count in Class

**Endpoint**: `GET /classes/{id}/learner-count`

```bash
curl -X GET http://localhost:3000/api/classes/class-uuid-123/learner-count \
  -H "Accept: application/json"
```

**Response** (200):
```json
{
  "count": 25
}
```

---

## Prompt Management

### 1. Create Prompt

**Endpoint**: `POST /prompts`

**⚠️ Important**: Requires authenticated user. Pass teacher ID as query parameter.

```bash
curl -X POST "http://localhost:3000/api/prompts?createdBy=teacher-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "skillType": "speaking",
    "content": "Describe your hometown in 2 minutes",
    "difficulty": "medium",
    "prepTime": 60,
    "responseTime": 120,
    "description": "Speaking cue card about hometown",
    "followUpQuestions": "What changes have you seen in your hometown?"
  }'
```

**Query Parameters**:
- `createdBy` (string, UUID) - **REQUIRED** - ID of the teacher creating the prompt

**Required Fields**:
- `skillType` (string: "speaking" or "writing" - must be lowercase)
- `content` (string)
- `difficulty` (string: "easy", "medium", or "hard" - must be lowercase)
- `prepTime` (number, seconds, min: 0)
- `responseTime` (number, seconds, min: 0)

**Optional Fields**:
- `description` (string)
- `followUpQuestions` (string)

**Response** (201):
```json
{
  "id": "prompt-uuid-123",
  "createdBy": "teacher-uuid-123",
  "skillType": "speaking",
  "content": "Describe your hometown in 2 minutes",
  "difficulty": "medium",
  "prepTime": 60,
  "responseTime": 120,
  "description": "Speaking cue card about hometown",
  "followUpQuestions": "What changes have you seen in your hometown?",
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get All Prompts

**Endpoint**: `GET /prompts`

```bash
curl -X GET "http://localhost:3000/api/prompts?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of prompts

---

### 3. Get Prompt by ID

**Endpoint**: `GET /prompts/{id}`

```bash
curl -X GET http://localhost:3000/api/prompts/prompt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Prompt object

---

### 4. Get Prompts by Skill Type

**Endpoint**: `GET /prompts/by-skill/{skillType}`

```bash
curl -X GET "http://localhost:3000/api/prompts/by-skill/speaking?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `skillType` (string: "speaking" or "writing" - must be lowercase)

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of prompts

---

### 5. Get Prompts by Difficulty

**Endpoint**: `GET /prompts/by-difficulty/{difficulty}`

```bash
curl -X GET "http://localhost:3000/api/prompts/by-difficulty/medium?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `difficulty` (string: "easy", "medium", or "hard" - must be lowercase)

**Response** (200): Paginated list of prompts

---

### 6. Get Prompts by Creator

**Endpoint**: `GET /prompts/by-creator/{creatorId}`

```bash
curl -X GET "http://localhost:3000/api/prompts/by-creator/teacher-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `creatorId` (string, UUID)

**Response** (200): Paginated list of prompts

---

### 7. Update Prompt

**Endpoint**: `PUT /prompts/{id}` or `PATCH /prompts/{id}`

```bash
curl -X PUT http://localhost:3000/api/prompts/prompt-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "difficulty": "ADVANCED",
    "responseTime": 180
  }'
```

**Optional Fields**:
- `skillType` (string)
- `content` (string)
- `difficulty` (string)
- `prepTime` (number)
- `responseTime` (number)
- `description` (string)
- `followUpQuestions` (string)

**Response** (200): Updated prompt object

---

### 8. Delete Prompt

**Endpoint**: `DELETE /prompts/{id}`

```bash
curl -X DELETE http://localhost:3000/api/prompts/prompt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 9. Filter Prompts

**Endpoint**: `POST /prompts/filter`

```bash
curl -X POST http://localhost:3000/api/prompts/filter \
  -H "Content-Type: application/json" \
  -d '{
    "skillType": "speaking",
    "difficulty": "medium",
    "limit": 10,
    "offset": 0
  }'
```

**Note**: All enum values must be lowercase

**Optional Fields**:
- `skillType` (string)
- `difficulty` (string)
- `limit` (number)
- `offset` (number)

**Response** (200): Paginated filtered results

---

## Assignment Management

### 1. Create Assignment

**Endpoint**: `POST /assignments`

```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class-uuid-123",
    "promptId": "prompt-uuid-123",
    "title": "Week 1 Speaking Practice",
    "description": "Students must complete this speaking assignment",
    "deadline": "2024-12-20T23:59:59Z",
    "status": "active",
    "allowLateSubmission": false
  }'
```

**Required Fields**:
- `classId` (string, UUID) - Class to assign to
- `promptId` (string, UUID) - Prompt being assigned
- `title` (string, 1+ chars) - Assignment title
- `deadline` (ISO date string) - Assignment deadline

**Optional Fields**:
- `description` (string) - Assignment description
- `status` (string: "draft", "active", or "archived", default: "draft")
- `allowLateSubmission` (boolean, default: false)
- `lateDeadline` (ISO date string, only if `allowLateSubmission` is true)

**Response** (201):
```json
{
  "id": "assignment-uuid-123",
  "classId": "class-uuid-123",
  "promptId": "prompt-uuid-123",
  "title": "Week 1 Speaking Practice",
  "description": "Students must complete this speaking assignment",
  "deadline": "2024-12-20T23:59:59Z",
  "status": "active",
  "totalEnrolled": 25,
  "totalSubmitted": 0,
  "totalScored": 0,
  "allowLateSubmission": false,
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get All Assignments

**Endpoint**: `GET /assignments`

```bash
curl -X GET "http://localhost:3000/api/assignments?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of assignments

---

### 3. Get Assignment by ID

**Endpoint**: `GET /assignments/{id}`

```bash
curl -X GET http://localhost:3000/api/assignments/assignment-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Assignment object with details

---

### 4. Get Assignments by Class

**Endpoint**: `GET /assignments/class/{classId}`

```bash
curl -X GET "http://localhost:3000/api/assignments/class/class-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of class assignments

---

### 5. Get Assignments by Status

**Endpoint**: `GET /assignments/by-status/{status}`

```bash
curl -X GET "http://localhost:3000/api/assignments/by-status/active?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `status` (string: "draft", "active", or "archived")

**Response** (200): Assignments filtered by status

---

### 6. Update Assignment

**Endpoint**: `PUT /assignments/{id}`

```bash
curl -X PUT http://localhost:3000/api/assignments/assignment-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Week 1 Speaking Practice",
    "deadline": "2024-12-25T23:59:59Z",
    "status": "active"
  }'
```

**Optional Fields**:
- `title` (string)
- `description` (string)
- `deadline` (ISO date string)
- `status` (string: "draft", "active", or "archived")
- `allowLateSubmission` (boolean)
- `lateDeadline` (ISO date string)

**Response** (200): Updated assignment object

---

### 7. Delete Assignment

**Endpoint**: `DELETE /assignments/{id}`

```bash
curl -X DELETE http://localhost:3000/api/assignments/assignment-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 8. Get Assignment Submissions (Student Responses)

**Endpoint**: `GET /assignments/{id}/submissions`

```bash
curl -X GET "http://localhost:3000/api/assignments/assignment-uuid-123/submissions?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): List of student submissions/attempts for this assignment

```json
{
  "data": [
    {
      "learnerId": "learner-uuid-1",
      "learnerName": "John Doe",
      "learnereEmail": "john@example.com",
      "attemptId": "attempt-uuid-1",
      "status": "SUBMITTED",
      "submittedAt": "2024-12-15T10:30:00Z",
      "score": 7.5,
      "feedback": "Good performance"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

---

### 9. Filter Assignments

**Endpoint**: `POST /assignments/filter`

```bash
curl -X POST http://localhost:3000/api/assignments/filter \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class-uuid-123",
    "status": "active",
    "limit": 10,
    "offset": 0
  }'
```

**Optional Fields**:
- `classId` (string)
- `status` (string)
- `limit` (number)
- `offset` (number)

**Response** (200): Filtered assignment list

---

## Attempt Management

### 1. Create Attempt

**Endpoint**: `POST /attempts`

```bash
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "learner-uuid-456",
    "promptId": "prompt-uuid-123",
    "skillType": "speaking"
  }'
```

**Required Fields**:
- `learnerId` (string, UUID)
- `promptId` (string, UUID)
- `skillType` (string: "speaking" or "writing" - must be lowercase)

**Response** (201):
```json
{
  "id": "attempt-uuid-123",
  "learnerId": "learner-uuid-456",
  "promptId": "prompt-uuid-123",
  "skillType": "speaking",
  "status": "in_progress",
  "createdAt": "2024-12-06T10:00:00Z",
  "startedAt": null,
  "submittedAt": null,
  "scoredAt": null
}
```

---

### 2. Get Attempt by ID

**Endpoint**: `GET /attempts/{id}`

```bash
curl -X GET http://localhost:3000/api/attempts/attempt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200):
```json
{
  "id": "attempt-uuid-123",
  "learnerId": "learner-uuid-456",
  "promptId": "prompt-uuid-123",
  "skillType": "speaking",
  "status": "in_progress",
  "promptContent": "Describe your hometown in 2 minutes",
  "promptDifficulty": "medium",
  "createdAt": "2024-12-06T10:00:00Z",
  "startedAt": "2024-12-06T10:05:00Z",
  "submittedAt": null,
  "scoredAt": null,
  "media": [
    {
      "id": "media-uuid-1",
      "mediaType": "audio",
      "storageUrl": "https://storage.example.com/audio-123.mp3",
      "fileName": "audio-123.mp3",
      "duration": 120,
      "fileSize": 1024000,
      "mimeType": "audio/mpeg",
      "uploadedAt": "2024-12-06T10:05:00Z"
    }
  ],
  "score": null,
  "feedbacks": []
}
```

---

### 3. Get All Attempts

**Endpoint**: `GET /attempts`

```bash
curl -X GET "http://localhost:3000/api/attempts?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of attempts

---

### 4. Get Attempts by Learner

**Endpoint**: `GET /attempts/learner/{learnerId}`

```bash
curl -X GET "http://localhost:3000/api/attempts/learner/learner-uuid-456?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of learner's attempts

---

### 5. Get Attempts by Learner and Status

**Endpoint**: `GET /attempts/learner/{learnerId}/status/{status}`

```bash
curl -X GET "http://localhost:3000/api/attempts/learner/learner-uuid-456/status/submitted?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `status` (string: "in_progress", "submitted", or "scored" - must be lowercase)

**Response** (200): Filtered attempts

---

### 6. Get Attempts by Prompt

**Endpoint**: `GET /attempts/prompt/{promptId}`

```bash
curl -X GET "http://localhost:3000/api/attempts/prompt/prompt-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of attempts for prompt

---

### 7. Get Attempts by Status

**Endpoint**: `GET /attempts/by-status/{status}`

```bash
curl -X GET "http://localhost:3000/api/attempts/by-status/submitted?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of attempts

---

### 8. Get Attempts by Skill Type

**Endpoint**: `GET /attempts/by-skill/{skillType}`

```bash
curl -X GET "http://localhost:3000/api/attempts/by-skill/speaking?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `skillType` (string: "speaking" or "writing" - must be lowercase)

**Response** (200): Paginated list of attempts

---

### 9. Update Attempt

**Endpoint**: `PUT /attempts/{id}`

```bash
curl -X PUT http://localhost:3000/api/attempts/attempt-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "startedAt": "2024-12-06T10:05:00Z"
  }'
```

**Optional Fields**:
- `status` (string: "in_progress", "submitted", or "scored")
- `startedAt` (ISO date string)
- `submittedAt` (ISO date string)

**Response** (200): Updated attempt object

---

### 10. Submit Attempt

**Endpoint**: `PUT /attempts/{id}/submit`

```bash
curl -X PUT http://localhost:3000/api/attempts/attempt-uuid-123/submit \
  -H "Content-Type: application/json" \
  -d '{
    "responseText": "This is my written response...",
    "content": "transcribed speech content",
    "aiRuleId": "ai-rule-uuid-123"
  }'
```

**Optional Fields**:
- `responseText` (string, for writing attempts)
- `content` (string, transcribed/speech content)
- `aiRuleId` (string, UUID, for automatic scoring)

**Response** (200):
```json
{
  "attempt": {
    "id": "attempt-uuid-123",
    "status": "SUBMITTED",
    "submittedAt": "2024-12-06T10:10:00Z",
    ...
  },
  "scoringJob": {
    "id": "job-uuid-123",
    "status": "PENDING",
    ...
  }
}
```

---

### 11. Delete Attempt

**Endpoint**: `DELETE /attempts/{id}`

```bash
curl -X DELETE http://localhost:3000/api/attempts/attempt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 12. Filter Attempts

**Endpoint**: `POST /attempts/learner/{learnerId}/filter`

```bash
curl -X POST http://localhost:3000/api/attempts/learner/learner-uuid-456/filter \
  -H "Content-Type: application/json" \
  -d '{
    "status": "submitted",
    "skillType": "speaking",
    "limit": 10,
    "offset": 0
  }'
```

**Optional Fields**:
- `status` (string: "in_progress", "submitted", or "scored" - must be lowercase)
- `skillType` (string: "speaking" or "writing" - must be lowercase)
- `limit` (number)
- `offset` (number)

**Response** (200): Filtered attempts

---

## Attempt Media Management

### 1. Upload Media

**Endpoint**: `POST /attempt-media`

```bash
curl -X POST http://localhost:3000/api/attempt-media \
  -H "Content-Type: application/json" \
  -d '{
    "attemptId": "attempt-uuid-123",
    "mediaType": "audio",
    "storageUrl": "https://storage.example.com/audio-123.mp3",
    "fileName": "audio-123.mp3",
    "duration": 120,
    "fileSize": 1024000,
    "mimeType": "audio/mpeg"
  }'
```

**Required Fields**:
- `attemptId` (string, UUID)
- `mediaType` (string: "audio" or "video")
- `storageUrl` (string, URL)
- `fileName` (string)

**Optional Fields**:
- `duration` (number, seconds)
- `fileSize` (number, bytes, max: 104857600)
- `mimeType` (string)

**Response** (201):
```json
{
  "id": "media-uuid-123",
  "attemptId": "attempt-uuid-123",
  "mediaType": "audio",
  "storageUrl": "https://storage.example.com/audio-123.mp3",
  "fileName": "audio-123.mp3",
  "duration": 120,
  "fileSize": 1024000,
  "mimeType": "audio/mpeg",
  "uploadedAt": "2024-12-06T10:05:00Z"
}
```

---

### 2. Get Media by ID

**Endpoint**: `GET /attempt-media/{id}`

```bash
curl -X GET http://localhost:3000/api/attempt-media/media-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Media object

---

### 3. Get All Media

**Endpoint**: `GET /attempt-media`

```bash
curl -X GET "http://localhost:3000/api/attempt-media?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of media

---

### 4. Get Media by Attempt

**Endpoint**: `GET /attempt-media/attempt/{attemptId}`

```bash
curl -X GET "http://localhost:3000/api/attempt-media/attempt/attempt-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Media files for attempt

---

### 5. Get Media by Type

**Endpoint**: `GET /attempt-media/by-type/{mediaType}`

```bash
curl -X GET "http://localhost:3000/api/attempt-media/by-type/audio?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `mediaType` (string: "audio" or "video")

**Response** (200): Paginated list of media

---

### 6. Update Media

**Endpoint**: `PUT /attempt-media/{id}`

```bash
curl -X PUT http://localhost:3000/api/attempt-media/media-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "updated-audio.mp3",
    "duration": 130
  }'
```

**Optional Fields**:
- `fileName` (string)
- `duration` (number)
- `fileSize` (number)

**Response** (200): Updated media object

---

### 7. Delete Media

**Endpoint**: `DELETE /attempt-media/{id}`

```bash
curl -X DELETE http://localhost:3000/api/attempt-media/media-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

## Score Management

### 1. Create Score

**Endpoint**: `POST /scores`

```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "attemptId": "attempt-uuid-123",
    "fluency": 7.0,
    "pronunciation": 6.5,
    "lexical": 7.5,
    "grammar": 7.0,
    "overallBand": 7.0,
    "feedback": "Good overall performance with room for improvement in pronunciation",
    "detailedFeedback": {
      "areas_strength": ["good_vocabulary", "clear_fluency"],
      "areas_improvement": ["pronunciation", "grammar"]
    }
  }'
```

**Required Fields**:
- `attemptId` (string, UUID)
- `fluency` (number, 0-9)
- `pronunciation` (number, 0-9)
- `lexical` (number, 0-9)
- `grammar` (number, 0-9)
- `overallBand` (number, 5-9)
- `feedback` (string)

**Optional Fields**:
- `detailedFeedback` (object)

**Response** (201):
```json
{
  "id": "score-uuid-123",
  "attemptId": "attempt-uuid-123",
  "fluency": 7.0,
  "pronunciation": 6.5,
  "lexical": 7.5,
  "grammar": 7.0,
  "overallBand": 7.0,
  "feedback": "Good overall performance with room for improvement in pronunciation",
  "detailedFeedback": {
    "areas_strength": ["good_vocabulary", "clear_fluency"],
    "areas_improvement": ["pronunciation", "grammar"]
  },
  "createdAt": "2024-12-06T11:00:00Z"
}
```

---

### 2. Get Score by ID

**Endpoint**: `GET /scores/{id}`

```bash
curl -X GET http://localhost:3000/api/scores/score-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Score object

---

### 3. Get Score by Attempt ID

**Endpoint**: `GET /scores/attempt/{attemptId}`

```bash
curl -X GET http://localhost:3000/api/scores/attempt/attempt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Score object for attempt

---

### 4. Get All Scores

**Endpoint**: `GET /scores`

```bash
curl -X GET "http://localhost:3000/api/scores?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of scores

---

### 5. Get Scores by Band

**Endpoint**: `GET /scores/by-band/{band}`

```bash
curl -X GET "http://localhost:3000/api/scores/by-band/7?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `band` (number: 5-9)

**Response** (200): Scores with specified band

---

### 6. Get Scores by Band Range

**Endpoint**: `GET /scores/by-band-range/{minBand}/{maxBand}`

```bash
curl -X GET "http://localhost:3000/api/scores/by-band-range/6/8?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Scores within band range

---

### 7. Update Score

**Endpoint**: `PUT /scores/{id}`

```bash
curl -X PUT http://localhost:3000/api/scores/score-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "fluency": 7.5,
    "overallBand": 7.5
  }'
```

**Optional Fields**:
- `fluency` (number)
- `pronunciation` (number)
- `lexical` (number)
- `grammar` (number)
- `overallBand` (number)
- `feedback` (string)
- `detailedFeedback` (object)

**Response** (200): Updated score object

---

### 8. Delete Score

**Endpoint**: `DELETE /scores/{id}`

```bash
curl -X DELETE http://localhost:3000/api/scores/score-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

## Feedback Management

### 1. Create Feedback

**Endpoint**: `POST /feedback`

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "attemptId": "attempt-uuid-123",
    "authorId": "teacher-uuid-123",
    "type": "TEACHER",
    "content": "Excellent pronunciation. Work on your grammar.",
    "visibility": "PUBLIC",
    "metadata": {
      "tone": "encouraging",
      "focus_areas": ["grammar", "fluency"]
    }
  }'
```

**Required Fields**:
- `attemptId` (string, UUID)
- `authorId` (string, UUID)
- `type` (string: "TEACHER" or "AI_GENERATED")
- `content` (string)
- `visibility` (string: "PUBLIC" or "PRIVATE")

**Optional Fields**:
- `metadata` (object)

**Response** (201):
```json
{
  "id": "feedback-uuid-123",
  "attemptId": "attempt-uuid-123",
  "authorId": "teacher-uuid-123",
  "type": "TEACHER",
  "content": "Excellent pronunciation. Work on your grammar.",
  "visibility": "PUBLIC",
  "metadata": {
    "tone": "encouraging",
    "focus_areas": ["grammar", "fluency"]
  },
  "createdAt": "2024-12-06T11:00:00Z",
  "updatedAt": "2024-12-06T11:00:00Z"
}
```

---

### 2. Get Feedback by ID

**Endpoint**: `GET /feedback/{id}`

```bash
curl -X GET http://localhost:3000/api/feedback/feedback-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Feedback object

---

### 3. Get All Feedback

**Endpoint**: `GET /feedback`

```bash
curl -X GET "http://localhost:3000/api/feedback?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Paginated list of feedback

---

### 4. Get Feedback by Attempt

**Endpoint**: `GET /feedback/attempt/{attemptId}`

```bash
curl -X GET "http://localhost:3000/api/feedback/attempt/attempt-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Feedback for attempt

---

### 5. Get Feedback by Attempt and Visibility

**Endpoint**: `GET /feedback/attempt/{attemptId}/visibility/{visibility}`

```bash
curl -X GET "http://localhost:3000/api/feedback/attempt/attempt-uuid-123/visibility/PUBLIC?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `visibility` (string: "PUBLIC" or "PRIVATE")

**Response** (200): Filtered feedback

---

### 6. Get Feedback by Author

**Endpoint**: `GET /feedback/author/{authorId}`

```bash
curl -X GET "http://localhost:3000/api/feedback/author/teacher-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Feedback by author

---

### 7. Get Feedback by Type

**Endpoint**: `GET /feedback/by-type/{type}`

```bash
curl -X GET "http://localhost:3000/api/feedback/by-type/TEACHER?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `type` (string: "TEACHER" or "AI_GENERATED")

**Response** (200): Feedback of type

---

### 8. Get Feedback by Visibility

**Endpoint**: `GET /feedback/by-visibility/{visibility}`

```bash
curl -X GET "http://localhost:3000/api/feedback/by-visibility/PUBLIC?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Feedback by visibility

---

### 9. Update Feedback

**Endpoint**: `PUT /feedback/{id}`

```bash
curl -X PUT http://localhost:3000/api/feedback/feedback-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated feedback with more specific guidance",
    "visibility": "PRIVATE"
  }'
```

**Optional Fields**:
- `content` (string)
- `visibility` (string)
- `metadata` (object)

**Response** (200): Updated feedback object

---

### 10. Delete Feedback

**Endpoint**: `DELETE /feedback/{id}`

```bash
curl -X DELETE http://localhost:3000/api/feedback/feedback-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 11. Filter Feedback by Attempt

**Endpoint**: `POST /feedback/attempt/{attemptId}/filter`

```bash
curl -X POST http://localhost:3000/api/feedback/attempt/attempt-uuid-123/filter \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEACHER",
    "visibility": "PUBLIC",
    "limit": 10,
    "offset": 0
  }'
```

**Optional Fields**:
- `type` (string)
- `visibility` (string)
- `limit` (number)
- `offset` (number)

**Response** (200): Filtered feedback

---

## AI Rule Management

### 1. Create AI Rule

**Endpoint**: `POST /ai-rules`

**⚠️ Important**: Pass teacher ID as query parameter. Do NOT include `teacherId` or `isActive` in request body.

```bash
curl -X POST "http://localhost:3000/api/ai-rules?teacherId=teacher-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard IELTS Speaking Rule",
    "description": "Default IELTS speaking scoring rule",
    "modelId": "gpt-4",
    "rubricId": "ielts_speaking",
    "weights": {
      "fluency": 0.25,
      "coherence": 0.25,
      "lexical": 0.25,
      "grammar": 0.25
    },
    "strictness": 1.0,
    "extraConfig": {
      "temperature": 0.7,
      "top_p": 0.9
    }
  }'
```

**Query Parameters**:
- `teacherId` (string, UUID) - **REQUIRED** - Teacher ID (passed as query parameter, not in body)

**Required Fields** (in request body):
- `name` (string, 1-255 chars)
- `modelId` (string, 1-255 chars, e.g., "qwen2-7b-finetuned", "gpt-4", "claude-3")
- `weights` (object) - **MUST sum to 1.0 ± 0.1**:
  - `fluency` (number, 0-1)
  - `coherence` (number, 0-1)
  - `lexical` (number, 0-1)
  - `grammar` (number, 0-1)
  - `pronunciation` (number, 0-1, optional)

**Optional Fields** (in request body):
- `rubricId` (string, 1-255 chars, e.g., "ielts_speaking", default: "ielts_speaking")
- `description` (string)
- `strictness` (number, 0.1-2.0, default: 1.0)
- `extraConfig` (object, e.g., `{"temperature": 0.7, "top_p": 0.9}`)

**Response** (201):
```json
{
  "id": "ai-rule-uuid-123",
  "teacherId": "teacher-uuid-123",
  "name": "Standard IELTS Speaking Rule",
  "description": "Default IELTS speaking scoring rule",
  "modelId": "gpt-4",
  "rubricId": "ielts_speaking",
  "weights": {
    "fluency": 0.25,
    "coherence": 0.25,
    "lexical": 0.25,
    "grammar": 0.25
  },
  "strictness": 1.0,
  "extraConfig": {
    "temperature": 0.7,
    "top_p": 0.9
  },
  "isActive": true,
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get AI Rule by ID

**Endpoint**: `GET /ai-rules/{id}`

```bash
curl -X GET http://localhost:3000/api/ai-rules/ai-rule-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): AI Rule object

---

### 3. Get All AI Rules

**Endpoint**: `GET /ai-rules`

```bash
curl -X GET "http://localhost:3000/api/ai-rules?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Query Parameters**:
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of AI rules

---

### 4. Get AI Rules by Teacher

**Endpoint**: `GET /ai-rules/teacher/{teacherId}`

```bash
curl -X GET "http://localhost:3000/api/ai-rules/teacher/teacher-uuid-123?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response** (200): Teacher's AI rules

---

### 5. Get Active AI Rules by Teacher

**Endpoint**: `GET /ai-rules/teacher/{teacherId}/active`

```bash
curl -X GET http://localhost:3000/api/ai-rules/teacher/teacher-uuid-123/active \
  -H "Accept: application/json"
```

**Response** (200): Active AI rules for teacher

---

### 6. Update AI Rule

**Endpoint**: `PUT /ai-rules/{id}` or `PATCH /ai-rules/{id}`

```bash
curl -X PATCH http://localhost:3000/api/ai-rules/ai-rule-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Rule",
    "weights": {
      "fluency": 0.3,
      "coherence": 0.2,
      "lexical": 0.25,
      "grammar": 0.25
    },
    "strictness": 1.2,
    "isActive": true
  }'
```

**Optional Fields**:
- `name` (string)
- `description` (string)
- `modelId` (string)
- `rubricId` (string)
- `weights` (object)
- `strictness` (number)
- `extraConfig` (object)
- `isActive` (boolean)

**Response** (200): Updated AI Rule object

---

### 7. Toggle AI Rule Status

**Endpoint**: `PUT /ai-rules/{id}/toggle`

```bash
curl -X PUT http://localhost:3000/api/ai-rules/ai-rule-uuid-123/toggle \
  -H "Accept: application/json"
```

**Response** (200): AI Rule with toggled status

---

### 8. Delete AI Rule

**Endpoint**: `DELETE /ai-rules/{id}`

```bash
curl -X DELETE http://localhost:3000/api/ai-rules/ai-rule-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

### 9. Filter AI Rules

**Endpoint**: `POST /ai-rules/filter`

```bash
curl -X POST http://localhost:3000/api/ai-rules/filter \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": "teacher-uuid-123",
    "isActive": true,
    "limit": 10,
    "offset": 0
  }'
```

**Optional Fields**:
- `teacherId` (string, UUID)
- `isActive` (boolean)
- `modelId` (string)
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response** (200): Paginated list of filtered AI rules

```json
{
  "data": [
    {
      "id": "ai-rule-uuid-123",
      "name": "Standard IELTS Speaking Rule",
      "modelId": "qwen2-7b-finetuned",
      "rubricId": "ielts_speaking",
      "strictness": 1.0,
      "isActive": true,
      "createdAt": "2024-12-06T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5
  }
}
```

---

## Learner Profile Management

### 1. Create Learner Profile

**Endpoint**: `POST /learner-profiles`

```bash
curl -X POST http://localhost:3000/api/learner-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "learner-uuid-456"
  }'
```

**Required Fields**:
- `learnerId` (string, UUID)

**Response** (201):
```json
{
  "id": "profile-uuid-123",
  "learnerId": "learner-uuid-456",
  "speakingAverageBand": 0,
  "writingAverageBand": 0,
  "totalAttempts": 0,
  "submittedAttempts": 0,
  "scoredAttempts": 0,
  "lastAttemptDate": null,
  "createdAt": "2024-12-06T10:00:00Z",
  "updatedAt": "2024-12-06T10:00:00Z"
}
```

---

### 2. Get Profile by Learner ID

**Endpoint**: `GET /learner-profiles/{learnerId}`

```bash
curl -X GET http://localhost:3000/api/learner-profiles/learner-uuid-456 \
  -H "Accept: application/json"
```

**Response** (200): Learner profile object

---

### 3. Update Learner Profile

**Endpoint**: `PUT /learner-profiles/{id}`

```bash
curl -X PUT http://localhost:3000/api/learner-profiles/profile-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "learnerId": "learner-uuid-456"
  }'
```

**Optional Fields**:
- `learnerId` (string)

**Response** (200): Updated profile object

---

## Scoring Jobs (Background Processing)

### 1. Create Scoring Job

**Endpoint**: `POST /scoring-jobs`

```bash
curl -X POST http://localhost:3000/api/scoring-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "attemptId": "attempt-uuid-123",
    "aiRuleId": "ai-rule-uuid-123",
    "status": "PENDING"
  }'
```

**Required Fields**:
- `attemptId` (string, UUID)

**Optional Fields**:
- `aiRuleId` (string, UUID)
- `status` (string: "PENDING", "PROCESSING", "COMPLETED", "FAILED")

**Response** (201): Scoring job object

---

### 2. Get Scoring Job by ID

**Endpoint**: `GET /scoring-jobs/{id}`

```bash
curl -X GET http://localhost:3000/api/scoring-jobs/job-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Scoring job object

---

### 3. Get Scoring Job by Attempt ID

**Endpoint**: `GET /scoring-jobs/attempt/{attemptId}`

```bash
curl -X GET http://localhost:3000/api/scoring-jobs/attempt/attempt-uuid-123 \
  -H "Accept: application/json"
```

**Response** (200): Scoring job for attempt

---

### 4. Get Pending Jobs (for workers)

**Endpoint**: `GET /scoring-jobs/pending/{limit}`

```bash
curl -X GET http://localhost:3000/api/scoring-jobs/pending/10 \
  -H "Accept: application/json"
```

**Path Parameters**:
- `limit` (number, max jobs to retrieve)

**Response** (200): Array of pending jobs

---

### 5. Get Jobs by Status

**Endpoint**: `GET /scoring-jobs/by-status/{status}`

```bash
curl -X GET "http://localhost:3000/api/scoring-jobs/by-status/COMPLETED?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Path Parameters**:
- `status` (string: "PENDING", "PROCESSING", "COMPLETED", "FAILED")

**Response** (200): Paginated jobs by status

---

### 6. Update Scoring Job Status

**Endpoint**: `PUT /scoring-jobs/{id}/status/{status}`

```bash
curl -X PUT http://localhost:3000/api/scoring-jobs/job-uuid-123/status/PROCESSING \
  -H "Accept: application/json"
```

**Path Parameters**:
- `status` (string: "PENDING", "PROCESSING", "COMPLETED", "FAILED")

**Response** (200): Updated job object

---

### 7. Update Scoring Job Error

**Endpoint**: `PUT /scoring-jobs/{id}/error`

```bash
curl -X PUT http://localhost:3000/api/scoring-jobs/job-uuid-123/error \
  -H "Content-Type: application/json" \
  -d '{
    "errorMessage": "Model timeout: exceeded 30 seconds"
  }'
```

**Required Fields**:
- `errorMessage` (string)

**Response** (200): Updated job object with error

---

### 8. Delete Scoring Job

**Endpoint**: `DELETE /scoring-jobs/{id}`

```bash
curl -X DELETE http://localhost:3000/api/scoring-jobs/job-uuid-123 \
  -H "Accept: application/json"
```

**Response** (204): No content

---

## Common Patterns and Tips

### Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Description of what went wrong"
}
```

### Using jq for Pretty Output

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Accept: application/json" | jq '.'
```

### Save Response to Variable

```bash
RESPONSE=$(curl -s -X GET http://localhost:3000/api/users/user-uuid-123)
TEACHER_ID=$(echo $RESPONSE | jq -r '.id')
echo "Teacher ID: $TEACHER_ID"
```

### Use in Script

```bash
#!/bin/bash

# Create a user
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "role": "TEACHER"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.id')

# Create a class with the user
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d "{
    \"teacherId\": \"$USER_ID\",
    \"name\": \"My Class\",
    \"code\": \"CLASS-001\"
  }"
```

### Pagination Pattern

Most list endpoints support pagination:

```bash
# First page
curl -X GET "http://localhost:3000/api/users?limit=10&offset=0"

# Next page
curl -X GET "http://localhost:3000/api/users?limit=10&offset=10"

# Custom page size
curl -X GET "http://localhost:3000/api/users?limit=50&offset=0"
```

### Filters

Many endpoints support filtering:

```bash
# Filter prompts
curl -X POST http://localhost:3000/api/prompts/filter \
  -H "Content-Type: application/json" \
  -d '{
    "skillType": "SPEAKING",
    "difficulty": "INTERMEDIATE",
    "limit": 10,
    "offset": 0
  }'

# Filter attempts
curl -X POST http://localhost:3000/api/attempts/learner/learner-uuid/filter \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUBMITTED",
    "skillType": "SPEAKING",
    "limit": 10
  }'
```

---

## Complete Workflow Example

```bash
#!/bin/bash

# ===== SETUP =====
API="http://localhost:3000/api"

# 1. Create a teacher account
echo "Creating teacher..."
TEACHER=$(curl -s -X POST $API/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "TeacherPass123!",
    "role": "teacher"
  }')
TEACHER_ID=$(echo $TEACHER | jq -r '.id')
echo "Teacher ID: $TEACHER_ID"

# 2. Create a learner account
echo "Creating learner..."
LEARNER=$(curl -s -X POST $API/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner@example.com",
    "password": "LearnerPass123!",
    "role": "learner"
  }')
LEARNER_ID=$(echo $LEARNER | jq -r '.id')
echo "Learner ID: $LEARNER_ID"

# 3. Create a class
echo "Creating class..."
CLASS=$(curl -s -X POST $API/classes \
  -H "Content-Type: application/json" \
  -d "{
    \"teacherId\": \"$TEACHER_ID\",
    \"name\": \"IELTS Speaking Prep\",
    \"code\": \"IELTS-001\"
  }")
CLASS_ID=$(echo $CLASS | jq -r '.id')
echo "Class ID: $CLASS_ID"

# 4. Enroll learner in class
echo "Enrolling learner..."
curl -s -X POST $API/classes/$CLASS_ID/enroll \
  -H "Content-Type: application/json" \
  -d "{\"learnerId\": \"$LEARNER_ID\"}"

# 5. Create a prompt
echo "Creating prompt..."
PROMPT=$(curl -s -X POST "$API/prompts?createdBy=$TEACHER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "skillType": "speaking",
    "content": "Describe a memorable trip",
    "difficulty": "medium",
    "prepTime": 60,
    "responseTime": 120
  }')
PROMPT_ID=$(echo $PROMPT | jq -r '.id')
echo "Prompt ID: $PROMPT_ID"

# 6. Create an AI rule
echo "Creating AI rule..."
AI_RULE=$(curl -s -X POST $API/ai-rules \
  -H "Content-Type: application/json" \
  -d "{
    \"teacherId\": \"$TEACHER_ID\",
    \"name\": \"Standard IELTS Rule\",
    \"modelId\": \"gpt-4\",
    \"rubricId\": \"ielts_speaking\",
    \"weights\": {
      \"fluency\": 0.25,
      \"coherence\": 0.25,
      \"lexical\": 0.25,
      \"grammar\": 0.25
    }
  }")
AI_RULE_ID=$(echo $AI_RULE | jq -r '.id')
echo "AI Rule ID: $AI_RULE_ID"

# 7. Create an attempt
echo "Creating attempt..."
ATTEMPT=$(curl -s -X POST $API/attempts \
  -H "Content-Type: application/json" \
  -d "{
    \"learnerId\": \"$LEARNER_ID\",
    \"promptId\": \"$PROMPT_ID\",
    \"skillType\": \"speaking\"
  }")
ATTEMPT_ID=$(echo $ATTEMPT | jq -r '.id')
echo "Attempt ID: $ATTEMPT_ID"

# 8. Upload media
echo "Uploading media..."
MEDIA=$(curl -s -X POST $API/attempt-media \
  -H "Content-Type: application/json" \
  -d "{
    \"attemptId\": \"$ATTEMPT_ID\",
    \"mediaType\": \"audio\",
    \"storageUrl\": \"https://example.com/audio.mp3\",
    \"fileName\": \"audio.mp3\",
    \"duration\": 120,
    \"fileSize\": 1024000,
    \"mimeType\": \"audio/mpeg\"
  }")
MEDIA_ID=$(echo $MEDIA | jq -r '.id')
echo "Media ID: $MEDIA_ID"

# 9. Submit attempt
echo "Submitting attempt..."
curl -s -X PUT $API/attempts/$ATTEMPT_ID/submit \
  -H "Content-Type: application/json" \
  -d "{\"aiRuleId\": \"$AI_RULE_ID\"}"

# 10. Create a score
echo "Creating score..."
SCORE=$(curl -s -X POST $API/scores \
  -H "Content-Type: application/json" \
  -d "{
    \"attemptId\": \"$ATTEMPT_ID\",
    \"fluency\": 7.0,
    \"pronunciation\": 6.5,
    \"lexical\": 7.5,
    \"grammar\": 7.0,
    \"overallBand\": 7.0,
    \"feedback\": \"Good performance overall\"
  }")
SCORE_ID=$(echo $SCORE | jq -r '.id')
echo "Score ID: $SCORE_ID"

# 11. Add feedback
echo "Adding feedback..."
FEEDBACK=$(curl -s -X POST $API/feedback \
  -H "Content-Type: application/json" \
  -d "{
    \"attemptId\": \"$ATTEMPT_ID\",
    \"authorId\": \"$TEACHER_ID\",
    \"type\": \"TEACHER\",
    \"content\": \"Excellent work! Work on pronunciation.\",
    \"visibility\": \"PUBLIC\"
  }")
FEEDBACK_ID=$(echo $FEEDBACK | jq -r '.id')
echo "Feedback ID: $FEEDBACK_ID"

echo ""
echo "===== WORKFLOW COMPLETE ====="
echo "Teacher: $TEACHER_ID"
echo "Learner: $LEARNER_ID"
echo "Class: $CLASS_ID"
echo "Prompt: $PROMPT_ID"
echo "AI Rule: $AI_RULE_ID"
echo "Attempt: $ATTEMPT_ID"
echo "Media: $MEDIA_ID"
echo "Score: $SCORE_ID"
echo "Feedback: $FEEDBACK_ID"
```

---

## Export/Report Management

### 1. Get Class Progress Report (JSON)

**Endpoint**: `GET /exports/classes/{classId}/progress`

```bash
curl -X GET http://localhost:3000/api/exports/classes/class-uuid-123/progress \
  -H "Accept: application/json"
```

**Response** (200): Class progress report with learner statistics

```json
{
  "classId": "class-uuid-123",
  "className": "IELTS Speaking Preparation - Batch A",
  "teacherId": "teacher-uuid-123",
  "totalLearners": 25,
  "reportGeneratedAt": "2024-12-06T11:00:00Z",
  "learners": [
    {
      "learnerId": "learner-uuid-1",
      "learnerName": "John Doe",
      "learnerEmail": "john@example.com",
      "totalAttempts": 5,
      "submittedAttempts": 4,
      "scoredAttempts": 3,
      "averageSpeakingScore": 7.2,
      "averageWritingScore": 6.8,
      "lastAttemptDate": "2024-12-05T15:30:00Z",
      "completionPercentage": 80
    }
  ],
  "summary": {
    "totalAttempts": 125,
    "totalSubmitted": 98,
    "totalScored": 75,
    "averageClassScore": 7.1,
    "completionRate": 78
  }
}
```

---

### 2. Export Class Progress as CSV

**Endpoint**: `GET /exports/classes/{classId}/csv`

```bash
curl -X GET http://localhost:3000/api/exports/classes/class-uuid-123/csv \
  -H "Accept: text/csv"
```

**Response** (200): CSV file (text/csv content type)

```
Learner Name,Email,Total Attempts,Submitted,Scored,Avg Speaking,Avg Writing,Last Attempt,Completion %
John Doe,john@example.com,5,4,3,7.2,6.8,2024-12-05,80
Jane Smith,jane@example.com,6,5,4,7.5,7.2,2024-12-04,83
...
```

---

### 3. Get Learner Report (JSON)

**Endpoint**: `GET /exports/learner/{learnerId}/report`

```bash
curl -X GET http://localhost:3000/api/exports/learner/learner-uuid-456/report \
  -H "Accept: application/json"
```

**Response** (200): Detailed learner report

```json
{
  "learnerId": "learner-uuid-456",
  "learnerName": "Jane Smith",
  "learnerEmail": "jane@example.com",
  "reportGeneratedAt": "2024-12-06T11:00:00Z",
  "enrolledClasses": [
    {
      "classId": "class-uuid-1",
      "className": "IELTS Speaking Preparation",
      "enrolledAt": "2024-11-01T10:00:00Z"
    }
  ],
  "attemptSummary": {
    "totalAttempts": 6,
    "submittedAttempts": 5,
    "scoredAttempts": 4,
    "averageSpeakingScore": 7.5,
    "averageWritingScore": 7.2,
    "progressTrend": "improving"
  },
  "attempts": [
    {
      "attemptId": "attempt-uuid-1",
      "promptContent": "Describe a memorable journey",
      "skillType": "speaking",
      "status": "SCORED",
      "submittedAt": "2024-12-04T14:20:00Z",
      "score": 7.5,
      "feedback": "Excellent fluency and pronunciation"
    }
  ],
  "recommendations": [
    "Continue practicing speaking fluency",
    "Work on expanding vocabulary",
    "Practice grammar structures in writing"
  ]
}
```

---

### 4. Export Learner Report as CSV

**Endpoint**: `GET /exports/learner/{learnerId}/csv`

```bash
curl -X GET http://localhost:3000/api/exports/learner/learner-uuid-456/csv \
  -H "Accept: text/csv"
```

**Response** (200): CSV file (text/csv content type)

```
Learner: Jane Smith (jane@example.com)
Report Generated: 2024-12-06T11:00:00Z

Attempt ID,Prompt,Skill Type,Status,Submitted Date,Score,Feedback
attempt-uuid-1,Describe a memorable journey,SPEAKING,SCORED,2024-12-04,7.5,"Excellent fluency and pronunciation"
attempt-uuid-2,Write about your future plans,WRITING,SCORED,2024-12-01,7.2,"Good structure, work on vocabulary"
...

Summary:
Total Attempts,Submitted,Scored,Avg Speaking,Avg Writing
6,5,4,7.5,7.2
```

---

### 5. Export Configuration

**Key Features**:
- Automatic CSV generation with proper formatting
- Includes all relevant student statistics
- Learner contact information for teacher communication
- Score breakdown by skill type
- Completion status and progress tracking
- Optional date range filtering

**Note**: Content-Type is automatically set to `text/csv` for CSV endpoints, allowing direct download in browsers and API clients.

---

## Validation Rules

### User Registration & Auth
- **Email**: Must be valid email format (@isEmail)
- **Password**: Minimum 6 characters (@minLength 6)
- **Confirm Password**: Minimum 6 characters, must match password (@minLength 6)
- Passwords must match (password === confirmPassword)
- Password and confirmPassword length validation applied via @minLength decorator

### Classes
- Teacher must exist (valid UUID)
- Class code must be unique (if provided)

### Prompts
- Skill type must be "speaking" or "writing" (lowercase)
- Difficulty must be "easy", "medium", or "hard" (lowercase)
- Prep time and response time must be >= 0

### Attempts
- Learner must exist
- Prompt must exist
- Skill type must be "speaking" or "writing" (lowercase)

### Scores
- All sub-scores must be 0-9
- Overall band must be 5-9
- All required fields must be provided

### AI Rules
- Weights must sum to approximately 1.0 (tolerance: ±0.1)
- All weight fields (fluency, coherence, lexical, grammar) must be present
- Teacher must exist
- Model ID and Rubric ID are required

---

## Response Status Codes

- **200 OK**: Successful GET/PUT/PATCH request
- **201 Created**: Successful POST request
- **204 No Content**: Successful DELETE request (no response body)
- **400 Bad Request**: Validation error or invalid input
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource or conflict
- **500 Internal Server Error**: Server error

---

## Debug Flags

Add verbose output to curl:

```bash
# Show headers and response
curl -v http://localhost:3000/api/users

# Show request and response
curl -i http://localhost:3000/api/users

# Show only response headers
curl -I http://localhost:3000/api/users
```

---

End of API Testing Guide
