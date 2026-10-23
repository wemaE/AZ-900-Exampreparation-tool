# AzureAce API Specification

Base URL: `http://localhost:5000/api`

---

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Returns service status, active mode (`live` or `demo`), indexed RAG chunk count, and uptime.

**Response (200 OK):**
```json
{
  "status": "ok",
  "mode": "live", // or "demo"
  "geminiConfigured": true,
  "ragChunksCount": 38,
  "timestamp": "2026-10-23T14:40:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Chat Query & Grounded Explanation

**Endpoint:** `POST /api/chat`

**Description:** Accepts a learner question, retrieves relevant RAG chunks, prompts Gemini (or Demo Engine) to produce a beginner-friendly explanation, an original relatable analogy, and one follow-up check.

**Request Body:**
```json
{
  "message": "What is the difference between IaaS and PaaS?",
  "topic": "cloud_concepts", // optional: "cloud_concepts" | "architecture_services" | "management_governance" | "exam_logistics"
  "action": "explain", // optional: "explain" | "simplify" | "example" | "compare" | "test_me"
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! Ready to master AZ-900?" }
  ]
}
```

**Response (200 OK):**
```json
{
  "answer": "Here is an intuitive explanation of IaaS vs PaaS...",
  "analogy": "Think of IaaS like renting an empty apartment where you bring your own furniture...",
  "followUp": "Would you like to try a practice question on shared responsibility?",
  "mode": "live", // or "demo"
  "sources": [
    {
      "sourceId": "01_official_az900_skills_outline",
      "sourceTitle": "AZ-900 Official Skills Outline — Scope Map",
      "sourceType": "official",
      "sourceUrl": "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900",
      "authority": "primary"
    }
  ]
}
```

---

### 3. Generate Practice Quiz Question

**Endpoint:** `POST /api/quiz`

**Description:** Generates a single original multiple-choice question. Note: Does **not** expose the correct answer or explanation to prevent client-side inspection leakage.

**Request Body:**
```json
{
  "topic": "cloud_concepts", // or "architecture_services", "management_governance"
  "context": "Storage redundancy LRS vs GRS" // optional context
}
```

**Response (200 OK):**
```json
{
  "quizId": "qz_948271049",
  "topic": "cloud_concepts",
  "question": "Which storage redundancy option replicates data synchronously three times within a single physical location in the primary region?",
  "options": [
    "Locally redundant storage (LRS)",
    "Zone-redundant storage (ZRS)",
    "Geo-redundant storage (GRS)",
    "Read-access geo-redundant storage (RA-GRS)"
  ],
  "disclaimer": "Practice questions, not official exam questions."
}
```

---

### 4. Evaluate Practice Quiz Answer

**Endpoint:** `POST /api/quiz/evaluate`

**Description:** Evaluates the user's selected answer against the server session, revealing whether it was correct, the explanation, misconception breakdown, and related topic links.

**Request Body:**
```json
{
  "quizId": "qz_948271049",
  "selectedOptionIndex": 0
}
```

**Response (200 OK):**
```json
{
  "isCorrect": true,
  "correctOptionIndex": 0,
  "correctOptionText": "Locally redundant storage (LRS)",
  "explanation": "LRS replicates your data three times within a single datacenter in the primary region.",
  "misconceptionCorrection": "Remember that ZRS copies data across three availability zones, while LRS keeps all 3 copies within one datacenter.",
  "source": {
    "title": "Microsoft Learn: Azure Storage redundancy",
    "url": "https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy"
  }
}
```
