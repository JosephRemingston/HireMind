# HireMind API Documentation

All API endpoints return JSON payloads wrapped in a standard structure:

```json
{
  "success": true,
  "message": "Human-readable status description",
  "data": { ... }
}
```

---

## 1. Authentication System (`/api/auth`)

### **Signup / User Registration**
*   **Endpoint:** `/api/auth/signup`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "name": "string (optional)",
      "email": "string (required, unique)",
      "password": "string (required)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "user": {
          "_id": "64b0f948bf813b1f5c6e8e81",
          "name": "John Doe",
          "email": "johndoe@example.com",
          "createdAt": "2026-07-16T11:05:00.000Z",
          "updatedAt": "2026-07-16T11:05:00.000Z"
        }
      }
    }
    ```

---

### **Login**
*   **Endpoint:** `/api/auth/login`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "email": "string (required)",
      "password": "string (required)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "user": {
          "_id": "64b0f948bf813b1f5c6e8e81",
          "name": "John Doe",
          "email": "johndoe@example.com"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```

---

### **Refresh Token**
*   **Endpoint:** `/api/auth/refresh`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json` (or `Authorization: Bearer <refreshToken>`)
*   **Request Body:**
    ```json
    {
      "refreshToken": "string (optional if Bearer auth header is sent)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Token refreshed successfully",
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```

---

### **Logout**
*   **Endpoint:** `/api/auth/logout`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Logged out successfully",
      "data": {}
    }
    ```

---

## 2. Resume & Batch Ingestion (`/api/resumes`)

### **Upload Resumes**
*   **Endpoint:** `/api/resumes/upload`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
    *   `Content-Type: multipart/form-data`
*   **Multipart Body Fields:**
    *   `batchName` (text, optional): Custom batch label. Defaults to dynamic timestamp batch label.
    *   `resumes` (file array): Multiple PDF resume files.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resumes uploaded successfully",
      "data": {
        "batch": {
          "_id": "64b0f9c2bf813b1f5c6e8e88",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "name": "Q3 Backend Hires",
          "totalResumes": 2,
          "parsedResumes": 0,
          "failedResumes": 0,
          "status": "processing",
          "createdAt": "2026-07-16T11:10:00.000Z",
          "updatedAt": "2026-07-16T11:10:00.000Z"
        },
        "resumes": [
          {
            "_id": "64b0f9c2bf813b1f5c6e8e89",
            "userId": "64b0f948bf813b1f5c6e8e81",
            "batchId": "64b0f9c2bf813b1f5c6e8e88",
            "originalFileName": "johndoe_resume.pdf",
            "s3RawKey": "64b0f948bf813b1f5c6e8e81/64b0f9c2bf813b1f5c6e8e88/raw/64b0f9c2bf813b1f5c6e8e89.pdf",
            "status": "pending",
            "createdAt": "2026-07-16T11:10:00.000Z",
            "updatedAt": "2026-07-16T11:10:00.000Z"
          }
        ],
        "failures": [
          {
            "fileName": "photo.png",
            "reason": "Unsupported file type. Only PDF resumes are accepted."
          }
        ]
      }
    }
    ```

---

### **List Batches**
*   **Endpoint:** `/api/resumes/batches`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Query Parameters:**
    *   `page` (number, optional, default: 1): Pagination index.
    *   `limit` (number, optional, default: 10, max: 50): Number of batches per page.
    *   `status` (string, optional): Filter by batch status (`"processing"`, `"ready"`).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Batches retrieved successfully",
      "data": {
        "batches": [
          {
            "_id": "64b0f9c2bf813b1f5c6e8e88",
            "userId": "64b0f948bf813b1f5c6e8e81",
            "name": "Q3 Backend Hires",
            "totalResumes": 2,
            "parsedResumes": 2,
            "failedResumes": 0,
            "status": "ready",
            "progress": {
              "totalResumes": 2,
              "parsedResumes": 2,
              "failedResumes": 0,
              "completedResumes": 2,
              "progress": 100,
              "status": "ready"
            }
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 10,
          "total": 1,
          "pages": 1
        }
      }
    }
    ```

---

### **Get Batch Details**
*   **Endpoint:** `/api/resumes/batches/:batchId`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Path Parameters:**
    *   `batchId` (string, required): The hex ID of the batch.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Batch retrieved successfully",
      "data": {
        "batch": {
          "_id": "64b0f9c2bf813b1f5c6e8e88",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "name": "Q3 Backend Hires",
          "totalResumes": 2,
          "parsedResumes": 2,
          "failedResumes": 0,
          "status": "ready",
          "progress": {
            "totalResumes": 2,
            "parsedResumes": 2,
            "failedResumes": 0,
            "completedResumes": 2,
            "progress": 100,
            "status": "ready"
          }
        }
      }
    }
    ```

---

### **Get Batch Progress**
*   **Endpoint:** `/api/resumes/batches/:batchId/progress`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Path Parameters:**
    *   `batchId` (string, required): The hex ID of the batch.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Batch progress retrieved successfully",
      "data": {
        "batchId": "64b0f9c2bf813b1f5c6e8e88",
        "progress": {
          "totalResumes": 10,
          "parsedResumes": 7,
          "failedResumes": 1,
          "completedResumes": 8,
          "progress": 80,
          "status": "processing"
        }
      }
    }
    ```

---

### **Get Batch Resumes**
*   **Endpoint:** `/api/resumes/batches/:batchId/resumes`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Path Parameters:**
    *   `batchId` (string, required): The hex ID of the batch.
*   **Query Parameters:**
    *   `status` (string, optional): Filter by parsing status (`"pending"`, `"parsed"`, `"failed"`).
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Batch resumes retrieved successfully",
      "data": {
        "batchId": "64b0f9c2bf813b1f5c6e8e88",
        "resumes": [
          {
            "_id": "64b0f9c2bf813b1f5c6e8e89",
            "userId": "64b0f948bf813b1f5c6e8e81",
            "batchId": "64b0f9c2bf813b1f5c6e8e88",
            "originalFileName": "johndoe_resume.pdf",
            "status": "parsed",
            "parsedData": {
              "contact": {
                "name": "John Doe",
                "email": "johndoe@example.com",
                "phone": "+1-123-456-7890",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe",
                "location": "San Francisco, CA"
              },
              "skills": [
                { "name": "Node.js", "category": "Frameworks" },
                { "name": "JavaScript", "category": "Languages" }
              ],
              "experience": [
                {
                  "title": "Backend Developer",
                  "company": "Tech Corp",
                  "dates": "Jan 2023 - Present",
                  "description": "Built REST APIs using Express and Node.js."
                }
              ],
              "education": [
                {
                  "institution": "Stanford University",
                  "degree": "BS",
                  "field": "Computer Science",
                  "dates": "2018 - 2022"
                }
              ],
              "certifications": [
                { "name": "AWS Solutions Architect" }
              ],
              "projects": [
                { "name": "E-Commerce App", "description": "Microservice shopping application" }
              ]
            }
          }
        ]
      }
    }
    ```

---

### **List All Resumes**
*   **Endpoint:** `/api/resumes/resumes`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Query Parameters:**
    *   `page` (number, optional, default: 1): Pagination index.
    *   `limit` (number, optional, default: 10, max: 50): Resumes per page.
    *   `status` (string, optional): Filter by parsing status (`"pending"`, `"parsed"`, `"failed"`).
    *   `batchId` (string, optional): Filter by specific batch ID.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resumes retrieved successfully",
      "data": {
        "resumes": [
          {
            "_id": "64b0f9c2bf813b1f5c6e8e89",
            "userId": "64b0f948bf813b1f5c6e8e81",
            "batchId": "64b0f9c2bf813b1f5c6e8e88",
            "originalFileName": "johndoe_resume.pdf",
            "status": "parsed"
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 10,
          "total": 1,
          "pages": 1
        }
      }
    }
    ```

---

### **Get Specific Resume Details**
*   **Endpoint:** `/api/resumes/resumes/:resumeId`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Path Parameters:**
    *   `resumeId` (string, required): Hex ID of the resume document.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Resume retrieved successfully",
      "data": {
        "resume": {
          "_id": "64b0f9c2bf813b1f5c6e8e89",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "batchId": "64b0f9c2bf813b1f5c6e8e88",
          "originalFileName": "johndoe_resume.pdf",
          "status": "parsed",
          "parsedData": {
            "contact": {
              "name": "John Doe",
              "email": "johndoe@example.com",
              "phone": "+1-123-456-7890",
              "linkedin": "linkedin.com/in/johndoe",
              "github": "github.com/johndoe",
              "location": "San Francisco, CA"
            },
            "skills": [
              { "name": "Node.js", "category": "Frameworks" }
            ],
            "experience": [],
            "education": [],
            "certifications": [],
            "projects": []
          }
        }
      }
    }
    ```

---

## 3. Job Description Management

### **Create Job Description**
*   **Endpoint:** `/api/resumes/jd`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
    *   `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "title": "Backend Engineering Intern",
      "rawText": "Seeking a Backend Intern. Requires knowledge of Node.js, Express, and databases. Location: San Francisco (Hybrid). Preferred degree: Bachelor's.",
      "keywords": ["Node.js", "Express"],
      "skills": [
        { "name": "Node.js", "category": "Frameworks" }
      ],
      "weights": {
        "skills": 0.40,
        "embedding": 0.20,
        "experience": 0.20,
        "education": 0.10,
        "responsibility": 0.05,
        "certification": 0.00,
        "location": 0.05
      }
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Job description saved successfully",
      "data": {
        "jobDescription": {
          "_id": "64b0fb5cbf813b1f5c6e8ea2",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "title": "Backend Engineering Intern",
          "rawText": "Seeking a Backend Intern...",
          "keywords": ["Node.js", "Express"],
          "requiredSkills": [
            { "name": "Node.js", "category": "Frameworks" },
            { "name": "Express", "category": "Frameworks" }
          ],
          "minimumExperience": { "years": 0 },
          "seniority": "intern",
          "location": "San Francisco (Hybrid)",
          "weights": {
            "skills": 0.40,
            "embedding": 0.20,
            "experience": 0.20,
            "education": 0.10,
            "responsibility": 0.05,
            "certification": 0.00,
            "location": 0.05
          }
        }
      }
    }
    ```

---

## 4. Matching & Ranking System (`/api/resumes`)

### **Run Match Pipeline**
*   **Endpoint:** `/api/resumes/match`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
    *   `Content-Type: application/json`
*   **Request Body (Option A - Using an existing Saved JD):**
    ```json
    {
      "jobDescriptionId": "64b0fb5cbf813b1f5c6e8ea2",
      "batchId": "64b0f9c2bf813b1f5c6e8e88",
      "limit": 10
    }
    ```
*   **Request Body (Option B - Using an Ad-Hoc JD Payload):**
    ```json
    {
      "jdPayload": {
        "title": "Backend Intern",
        "rawText": "Require JavaScript, Node.js, Express.",
        "keywords": ["JavaScript"]
      },
      "batchId": "64b0f9c2bf813b1f5c6e8e88",
      "weights": {
        "skills": 0.50,
        "embedding": 0.50
      },
      "limit": 5
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Matching completed successfully",
      "data": {
        "matchResult": {
          "_id": "64b0fbd8bf813b1f5c6e8eb4",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "jobDescriptionId": "64b0fb5cbf813b1f5c6e8ea2",
          "batchId": "64b0f9c2bf813b1f5c6e8e88",
          "weights": {
            "skills": 0.40,
            "embedding": 0.20,
            "experience": 0.20,
            "education": 0.10,
            "responsibility": 0.05,
            "certification": 0.00,
            "location": 0.05
          },
          "results": [
            {
              "resumeId": "64b0f9c2bf813b1f5c6e8e89",
              "candidateName": "John Doe",
              "finalScore": 0.842,
              "scores": {
                "embedding": 0.81,
                "skills": 0.90,
                "experience": 0.80,
                "education": 1.00,
                "certification": 1.00,
                "responsibility": 0.85,
                "location": 1.00
              },
              "domain": {
                "score": 0.85,
                "primaryMismatch": false,
                "jdProfile": "Backend development",
                "resumeProfile": "Backend development"
              },
              "explanation": {
                "strengths": [
                  "Strong domain alignment (85% similarity).",
                  "Meets all mandatory skill requirements."
                ],
                "weaknesses": [],
                "penalties": []
              }
            }
          ]
        }
      }
    }
    ```

---

### **List Match Reports**
*   **Endpoint:** `/api/resumes/matches`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Query Parameters:**
    *   `page` (number, optional, default: 1): Pagination index.
    *   `limit` (number, optional, default: 10, max: 50): Number of records per page.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Match results retrieved successfully",
      "data": {
        "matches": [
          {
            "_id": "64b0fbd8bf813b1f5c6e8eb4",
            "userId": "64b0f948bf813b1f5c6e8e81",
            "jobDescriptionId": "64b0fb5cbf813b1f5c6e8ea2",
            "batchId": "64b0f9c2bf813b1f5c6e8e88",
            "createdAt": "2026-07-16T11:15:00.000Z"
          }
        ],
        "pagination": {
          "page": 1,
          "limit": 10,
          "total": 1,
          "pages": 1
        }
      }
    }
    ```

---

### **Get Specific Match Report Details**
*   **Endpoint:** `/api/resumes/matches/:matchId`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Path Parameters:**
    *   `matchId` (string, required): Hex ID of the match result.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Match result retrieved successfully",
      "data": {
        "match": {
          "_id": "64b0fbd8bf813b1f5c6e8eb4",
          "userId": "64b0f948bf813b1f5c6e8e81",
          "jobDescriptionId": "64b0fb5cbf813b1f5c6e8ea2",
          "batchId": "64b0f9c2bf813b1f5c6e8e88",
          "weights": { ... },
          "results": [ ... ]
        }
      }
    }
    ```
