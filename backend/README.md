# AzureAce Backend Service

The backend API and RAG engine for **AzureAce — AZ-900 AI Study Buddy**. Built with Node.js, Express, and TypeScript, it handles grounded RAG retrieval from the AZ-900 markdown pack, Google Gemini AI orchestration, and secure quiz evaluation.

## Features

- **Grounded RAG Pipeline**: Chunks and searches the official Microsoft AZ-900 skills outline, secondary study notes, and segregated Pearson OnVUE exam logistics located in `backend/rag/` (49 indexed chunks).
- **AI Mode Flexibility**: Automatically runs in **Live Mode** if `GEMINI_API_KEY` is configured, or an offline, grounded **Demo Mode** if the key is omitted.
- **Cheat-Proof Quiz Engine**: Delivers original practice questions without leaking the correct answer in the question payload. Answers are evaluated securely on the server with misconception correction.
- **Production Hardened**: Uses `helmet`, configurable CORS (`FRONTEND_URL`), express rate limiting, and binds to `0.0.0.0` on `PORT`.

## Knowledge Base (`backend/rag/`)

- `00_rag_index_and_rules.md`: Ingestion rules and authority hierarchy.
- `01_official_az900_skills_outline.md`: Official Microsoft Learn AZ-900 scope map (Primary).
- `02_user_supplied_azure_fundamentals_qa.md`: Azure Fundamentals study notes (Secondary).
- `03_management_tools_and_cloud_concepts.md`: Management tools and cloud models (Secondary).
- `04_onvue_exam_day_logistics.md`: Pearson OnVUE exam rules (Isolated collection).
- `05_youtube_resource_manifest.md`: Verified YouTube reference manifest.
- `06_hackathon_brief.md`: Project requirements and hackathon guidelines.

## Available Scripts

- `npm run dev`: Start development server with hot reload (`tsx watch src/server.ts`).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Run the compiled production server (`node dist/server.js`).
- `npm run test`: Run the test suite with Vitest (`vitest run`).
- `npm run ingest`: Run the RAG ingestion audit script (`tsx scripts/ingestRag.ts`).

## Configuration

See `.env.example` at the repository root. Key variables:
- `PORT`: Server listen port (default: `5000`). Binds to `0.0.0.0`.
- `NODE_ENV`: `development` | `production` | `test`.
- `GEMINI_API_KEY`: Google Gemini API key (optional; Demo Mode activates if omitted).
- `GEMINI_MODEL`: Gemini model identifier (default: `gemini-2.5-flash`).
- `FRONTEND_URL`: Allowed CORS origin for the deployed frontend.
- `RAG_DOCS_PATH`: Optional path override for the knowledge directory (defaults to `./rag`).
