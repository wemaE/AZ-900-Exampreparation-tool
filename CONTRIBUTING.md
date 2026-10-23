# Contributing to AzureAce — AZ-900 AI Study Buddy

Thank you for your interest in contributing to AzureAce! We welcome community contributions to improve learners' study experience.

## Code of Conduct

- Be welcoming, inclusive, and respectful of learners of all skill levels.
- Provide constructive feedback during code reviews.

## Branch Strategy

- `main`: Default, stable integration branch.
- `frontend`: Frontend UI features and improvements.
- `backend`: Backend API, Gemini integration, RAG pipeline, and tests.

## Development Workflow

1. Fork or clone the repository.
2. Create a feature branch off `main`, `frontend`, or `backend`.
3. Follow the project coding standards:
   - TypeScript for both frontend and backend.
   - Clean, typed REST APIs.
   - Grounded citations for any AZ-900 content additions.
4. Run tests and verify builds:
   ```bash
   npm run test
   npm run build
   ```
5. Submit a Pull Request targeting the appropriate branch with a clear description of changes.

## Content & Grounding Policy

- Never commit real, leaked, or confidential exam question dumps.
- All AI practice questions must be marked "practice questions, not official exam questions."
- Prefer official Microsoft Learn documentation as the primary source of truth.
