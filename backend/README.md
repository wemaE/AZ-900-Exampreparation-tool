# AzureAce Backend Service

The backend service for **AzureAce — AZ-900 AI Study Buddy**. Built with Node.js, Express, and TypeScript, it handles grounded RAG retrieval from the AZ-900 markdown pack, Google Gemini AI orchestration, and secure quiz evaluation.

## Features

- **Grounded RAG Pipeline**: Chunks and searches the official Microsoft AZ-900 skills outline, secondary PDF notes, and segregated Pearson OnVUE exam logistics.
- **AI Mode Flexibility**: Automatically runs in **Live Mode** if `GEMINI_API_KEY` is present, or a rich, grounded **Demo Mode** if the key is missing.
- **Cheat-Proof Quiz Engine**: Delivers original practice questions without leaking the correct answer in the question payload. Answers are evaluated securely on the server with misconception correction.
- **Hardened Security**: Includes `helmet`, CORS validation, rate limiting, and strict input bounds.

## Available Scripts

- `npm run dev`: Start development server with live reload (`tsx watch src/server.ts`).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Run the compiled production server.
- `npm run test`: Run the test suite with Vitest.
- `npm run ingest`: Run the RAG ingestion audit script.
