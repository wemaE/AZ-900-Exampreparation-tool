# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within AzureAce, please do not open a public issue. Instead, report it privately by emailing security disclosures or opening a private advisory on GitHub.

## Security Practices

- **Zero-Secret Client**: All API keys, Google Gemini credentials, and RAG ingestion secrets remain server-side.
- **Input Validation**: All incoming requests to `/api/chat` and `/api/quiz` are strictly sanitized and length-capped.
- **Rate Limiting**: Basic IP rate-limiting protects against abuse and API exhaustion.
- **Data Privacy**: No user chat messages are permanently logged or shared with unapproved third parties.
