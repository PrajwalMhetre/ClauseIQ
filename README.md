# ClauseIQ
**ClauseIQ** is an AI-powered legal document intelligence platform that analyzes contracts and legal PDFs using LLMs and RAG. It provides document summarization, clause extraction, risk detection, semantic search, and an AI chatbot for document-based Q&amp;A, helping users review legal documents faster and more accurately.

## Local development

Copy `backend/.env.example` to `backend/.env`, set a unique `SECRET_KEY`, and add `OPENAI_API_KEY` for real analysis. `AI_MODE=mock` is available only for development/testing and is visibly non-legal placeholder output. Install dependencies with `pip install -r backend/requirements.txt` and `npm ci --prefix frontend`, then run `npm run dev:backend` and `npm run dev:frontend`.

The browser currently uses short-lived bearer tokens stored in `localStorage` to preserve the existing SPA architecture. This is vulnerable to token theft if an XSS vulnerability exists; use a strict Content Security Policy and migrate to secure HttpOnly cookies plus CSRF protection before handling sensitive production workloads. Tokens are validated against a user session version, so logout and password reset invalidate existing tokens.

Password resets use single-use, hashed, expiring tokens. Configure a real email provider before production; `EMAIL_PROVIDER=console` prints a link only in development. Set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` once to create an administrator—there is no default admin account.

Risk scores are an AI-assisted rubric: high risk indicates uncapped, unilateral, or material exposure; medium indicates ambiguous or unfavorable terms; low indicates standard or bounded terms. Outputs are legal-information assistance, not legal advice, and require human review.
