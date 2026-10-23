# GitHub Repository Setup Checklist

## Owner profile

https://github.com/wemaE

## Repository

- Display name: `AZ-900 Exampreparation tool`
- Visibility: Public
- Description: `Unofficial AZ-900 AI Study Buddy with grounded explanations, original practice questions, and RAG-backed learning resources.`
- Suggested valid slug if needed: `az-900-exampreparation-tool`
- Default/integration branch: `main`
- Working branches: `frontend`, `backend`

## Suggested structure

```text
AZ-900-Exampreparation-tool/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
├── .gitignore
├── .env.example
├── package.json                 # optional workspace scripts
├── frontend/
│   ├── package.json
│   ├── src/
│   └── README.md
├── backend/
│   ├── package.json
│   ├── src/
│   ├── scripts/
│   └── README.md
├── rag/
│   ├── 00_rag_index_and_rules.md
│   ├── 01_official_az900_skills_outline.md
│   ├── 02_user_supplied_azure_fundamentals_qa.md
│   ├── 03_management_tools_and_cloud_concepts.md
│   ├── 04_onvue_exam_day_logistics.md
│   ├── 05_youtube_resource_manifest.md
│   └── 06_hackathon_brief.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEMO_SCRIPT.md
└── .github/
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

## Branch meaning

- `main`: tested, integrated, demoable application and canonical docs.
- `frontend`: React/Vite UI work.
- `backend`: Express API, Gemini integration, RAG ingestion/retrieval, tests.

Create actual commits and merge tested branches to `main`. A branch is not “organized” merely because it exists.

## GitHub safety

- Authenticate with GitHub CLI or browser; do not paste personal access tokens into prompts/chat.
- Confirm repository visibility and URL after creation.
- Never commit `.env`, credentials, user-specific certificate PDFs, or private data.
- Do not commit build outputs, `node_modules`, or local cache files.
- Use issue/PR templates only if time permits.
