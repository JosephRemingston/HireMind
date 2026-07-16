# HireMind Backend

A production-grade AI-powered resume parser and matching engine. HireMind reads unstructured PDF resumes, extracts data into JSON via **Gemini 1.5 Flash** (with a fallback regex parser), generates local semantic embeddings via **all-MiniLM-L6-v2**, and ranks candidates against Job Descriptions using a combination of semantic, skill, and multi-factor experience scoring.

---

## Technical Stack & Architecture

- **Runtime:** Node.js (ES Modules)
- **Database:** MongoDB (Mongoose schemas for users, resumes, batches, and job descriptions)
- **Caching & Queue:** Redis + BullMQ (asynchronous resume extraction workers)
- **AI Processing:**
  - **Resume Parsing:** Gemini 1.5 Flash (`@google/generative-ai`)
  - **Synonym Skill Matching:** Local Sentence Embeddings (`@xenova/transformers` - `Xenova/all-MiniLM-L6-v2`)
  - **Storage:** Amazon S3 / Local-compatible S3 configuration

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB instance running locally or via Atlas
- Redis instance running locally or via cloud
- S3 Bucket for raw resume storage

### 2. Configuration (`.env`)
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hiremind
REDIS_URI=redis://localhost:6379

# Access Token Config
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Gemini AI (Optional - if omitted, defaults to Regex Parser)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation
```bash
npm install
```

### 4. Running the Application
HireMind runs a separate HTTP server and asynchronous parsing queue worker. You can run them concurrently:
```bash
# Runs both Server & Queue Worker concurrently
npm run dev

# Or run them individually:
npm run start-server
npm run start-worker
```

### 5. Running Tests & Benchmarks
```bash
# Run unit tests
npm test

# Run the ranking evaluator (against sample resumes and JDs)
node evaluate_matching.js
```

---

## Core Engine Logic

### 1. Resume Parser
When a PDF is uploaded, the worker extracts its raw text.
- If `GEMINI_API_KEY` is configured, it calls **Gemini 1.5 Flash** with a strict JSON schema prompt to isolate structured experiences, education, and skills.
- If the call fails or no key is provided, it falls back to a **regex-based parser** to ensure high-availability.

### 2. Semantic Synonym Matching
Instead of doing strict string matching, HireMind runs a two-pass matching system for Job Description required skills:
- **Pass 1:** Exact string matches (zero cost, immediate).
- **Pass 2:** Fuzzy mapping for any missing required skills using local Sentence Embeddings. If similarity matches at **≥ 0.82**, they are recognized as equivalents (e.g. `Postgres` ↔ `PostgreSQL`, `k8s` ↔ `Kubernetes`, `AWS` ↔ `Amazon Web Services`).

### 3. Dynamic Weights
You can set custom weights on a Job Description (persisted at `/api/resumes/jd` or provided ad-hoc inside the `/api/resumes/match` payload).
```json
{
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

---

## API Documentation
See the detailed endpoint specifications here:
👉 **[API_DOCUMENTATION.md](API_DOC.md)**
