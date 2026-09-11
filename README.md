# AI Recovery Coach

A backend-first habit-change app. Users log structured check-ins; the API stores them in PostgreSQL and later asks an LLM for one structured insight.

This is a portfolio project focused on **TypeScript, Node.js, PostgreSQL, and production LLM engineering** (structured outputs, generation logging, safety). The product idea may change; the data and API contracts are the stable core.

## Current status

Milestone 3: Prisma API + a minimal React UI for register/login and daily check-ins. No LLM calls yet.

## Requirements

- Node.js 22+
- Docker Desktop (for this project's Postgres)

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

Open http://localhost:5173. The UI talks to the API at http://localhost:3000 and sends the login cookie (`credentials: "include"`).

This project's Docker Postgres is on **localhost:5434** so it does not collide with a local Postgres on 5432 or another container on 5433. `DATABASE_URL` in `.env` must use port `5434`.

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","service":"api"}`

### Auth and check-ins

Register (saves an httpOnly cookie):

```bash
curl -s -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"alex@example.com","password":"password12"}' \
  http://localhost:3000/auth/register
```

Create today's check-in:

```bash
curl -s -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"occurredOn":"2026-09-11","urgeIntensity":4,"actedOnUrge":false,"trigger":"late night"}' \
  http://localhost:3000/check-ins
```

List your check-ins:

```bash
curl -s -b cookies.txt http://localhost:3000/check-ins
```

### LLM keys (not used yet)

Create a Groq key at [console.groq.com](https://console.groq.com) and put it in `.env` as `GROQ_API_KEY`. Never commit `.env`. When real users exist, we will switch to OpenAI `gpt-5-nano` via `LLM_PROVIDER` / `OPENAI_API_KEY`.

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
apps/web    React UI (register, check-in, history)
```
