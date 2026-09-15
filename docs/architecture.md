# Architecture

This is a single-repo backend-first habit-change app. The product loop is:

1. A user registers and logs in.
2. They save one structured check-in per day.
3. PostgreSQL stores the row and computes stats (counts, averages, streak).
4. Optionally, the API asks Groq for one JSON insight from recent check-ins.
5. Every generation is stored in `insights` for later inspection.

The React app is a thin client. It does not call Groq.

```
Browser (Vite, localhost:5173)
  -> Fastify API (localhost:3000)
       -> PostgreSQL (Docker, localhost:5434)
       -> Groq (insights only; skipped on crisis language)
```

## Why this shape

- One Node API, one database. No microservices.
- The check-in write path does not depend on the LLM. If Groq is down, the day is still recorded.
- Stats are SQL/TypeScript, never the model.
- Groq is a replaceable vendor behind `InsightGenerator` (`fake` in tests, `groq` locally, later `openai`).

## Data

| Table | Role |
| --- | --- |
| `users` | Account. Passwords stored as bcrypt hashes. |
| `check_ins` | Source of truth. Unique `(user_id, occurred_on)`. |
| `insights` | LLM (or safety) audit log: prompt version, model, tokens, latency, status. |

Notes are stored on `check_ins` but are **not** sent to Groq.

## LLM contract

Prompt version: `insight-v1`.

Input: last 14 check-ins up to the source day: date, urge 0–10, acted-on-urge, trigger.

Output JSON:

```json
{
  "pattern": "string",
  "suggestedAction": "string",
  "encouragement": "string"
}
```

Statuses: `success`, `failed`, `skipped_safety`. Generating twice for the same check-in returns the stored success/safety row (no second Groq call).

## Safety

Crisis-like language in `trigger` or `note` is matched with a fixed phrase list **before** Groq is called. The API stores `skipped_safety` and returns a fixed resource message (US 988, IASP). This is not a clinical detector; it is a backend guardrail.

The model is instructed that it is not a therapist or doctor. The UI always shows a disclaimer.

## Auth

Email/password. JWT in an httpOnly cookie. CORS allows `WEB_ORIGIN` with credentials so the Vite app can send the cookie across ports.

## Local ports

| Service | Port |
| --- | --- |
| API | 3000 |
| Web | 5173 |
| This project's Postgres | 5434 |

5432/5433 may already be other Postgres servers on the same machine.
