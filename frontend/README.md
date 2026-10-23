# AzureAce Frontend

The web client for **AzureAce — AZ-900 AI Study Buddy**. Built with React, TypeScript, and Vite, featuring an accessible, modern dark aesthetic, real-time citation links, quick message action chips, and an interactive practice quiz mode.

## Features

- **Modern Responsive Design**: Accessible contrast, smooth micro-interactions, Outfit & Plus Jakarta Sans typography.
- **Interactive Chat Journey**: Beginner-friendly explanations with relatable real-world/African analogies and check questions.
- **Quick Action Chips**: Single-click `Simplify`, `Give example`, `Compare`, and `Test me`.
- **Grounded Source Citations**: Distinguishable badges linking directly to Microsoft Learn documentation.
- **Practice Quiz Engine**: Interactive 4-choice questions with server-evaluated feedback and misconception corrections.
- **Zero-Secret Client**: All API requests flow securely through the backend REST API.

## Development Scripts

- `npm run dev`: Start Vite development server at `http://localhost:5173`.
- `npm run build`: Compile TypeScript and build production bundle into `dist/`.
- `npm run preview`: Preview the production bundle locally.

## Configuration

- `VITE_API_BASE_URL`: Base URL of the backend API service (e.g. `https://azureace-backend.onrender.com`). If omitted, requests fall back to relative `/api` (matching local Vite dev proxy). The client automatically appends `/api` if not present.
