# AI Recovery Coach

A backend-first habit-change app. Users log structured check-ins; PostgreSQL stores them; SQL computes stats; Groq may return one structured insight. This is a public portfolio project (TypeScript, Node.js, PostgreSQL, production-style LLM usage). It is not a medical or therapy product.

## Current status

V1: auth, daily check-ins, SQL stats, Groq structured insights, crisis short-circuit (`skipped_safety` — Groq is not called), and docs.

## Requirements

- Node.js 22+
- Docker Desktop (for this project's Postgres)
- A Groq API key for live insights ([console.groq.com](https://console.groq.com)). Tests use a fake provider and do not call Groq.

## Local setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

Open http://localhost:5173. Put `GROQ_API_KEY` in `.env` and restart the API before generating a live insight. Never commit `.env`.

This project's Docker Postgres is on **localhost:5434** (database `recovery_coach`). Other Postgres servers on 5432/5433 are not this app.

```bash
curl http://localhost:3000/health
```

## Docs

- [Architecture](docs/architecture.md)
- [API](docs/api.md)

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:api` | Start the Fastify API with reload |
| `npm run dev:web` | Start the React app |
| `npm run test:api` | API tests (needs Docker Postgres) |
| `npm run typecheck:api` | TypeScript check |
| `npm run db:migrate` | Create/apply Prisma migrations |

## Repo layout

```
apps/api    Fastify + TypeScript API
apps/web    React UI
docs        Architecture and API notes
```
