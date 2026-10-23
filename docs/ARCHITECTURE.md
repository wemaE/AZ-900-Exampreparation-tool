# AzureAce System Architecture

```mermaid
graph TD
    User["Learner Browser / Mobile"] -->|HTTP / REST| Frontend["React + TypeScript + Vite UI<br/>(Components, State, Accessible Design)"]
    Frontend -->|POST /api/chat<br/>POST /api/quiz| Backend["Express.js Server<br/>(Node.js + TypeScript)"]
    
    subgraph "Backend Engine"
        Validator["Request Validation & Rate Limiter"]
        Router["Express API Router"]
        RAG["RAG Retrieval Engine<br/>(Hybrid Keyword & Semantic Context Extractor)"]
        Gemini["Google Gemini Client<br/>(@google/genai / Generative AI SDK)"]
        DemoEngine["Demo Fallback Engine<br/>(Pre-indexed Grounded Q&A / Quiz)"]
        QuizStore["Secure In-Memory Quiz Session Store"]
    end

    Backend --> Validator
    Validator --> Router
    Router --> RAG
    Router --> QuizStore
    
    RAG -->|Grounding Chunks| Gemini
    RAG -->|Grounding Chunks| DemoEngine
    
    subgraph "Knowledge Base (rag/)"
        Doc1["01_official_az900_skills_outline.md<br/>(Official Primary)"]
        Doc2["02_user_supplied_azure_fundamentals_qa.md<br/>(Secondary Notes)"]
        Doc3["03_management_tools_and_cloud_concepts.md<br/>(Secondary Notes)"]
        Doc4["04_onvue_exam_day_logistics.md<br/>(Logistics Collection)"]
    end
    
    Doc1 --> RAG
    Doc2 --> RAG
    Doc3 --> RAG
    Doc4 --> RAG
```

## Architectural Highlights

1. **Security & Privacy**:
   - The frontend never sees or receives API keys or unvetted secrets.
   - Quiz questions do not expose the correct answer or explanations to the client before answer submission, preventing client-side inspection cheating.

2. **RAG Knowledge Base & Strict Source Hierarchy**:
   - Primary: Official Microsoft Learn Study Guide (`01_official_az900_skills_outline.md`).
   - Secondary: User-supplied exam notes (`02` & `03`).
   - Isolated: Pearson OnVUE exam logistics (`04`) are partitioned so they never contaminate Azure technical questions.
   - Non-hallucinatory: In absence of grounded content, the system transparently indicates unverified status.

3. **Graceful Demo Fallback**:
   - When `GEMINI_API_KEY` is not configured, the app automatically runs in a clearly marked **Demo Mode** with grounded pre-compiled explanations and interactive quizzes.
