# AI Recovery Coach

A backend-first habit-change app. Users log structured check-ins; PostgreSQL stores them; SQL computes stats; Groq may return one structured insight. The repository includes a React UI and a TypeScript API with interchangeable fake and Groq insight providers. It is not a medical or therapy product.

## Implemented features and technologies

- Email/password registration, login, logout, and current-user lookup. Passwords are hashed with bcrypt; authentication uses JWTs in httpOnly cookies.
- One check-in per user per day, with an urge score, acted-on-urge flag, optional trigger, and optional note. The UI lists recent check-ins.
- SQL-derived totals and seven-day aggregates, plus a TypeScript check-in streak calculation.
- Structured insights from either a deterministic fake provider or Groq. Successful and safety insights are reused on subsequent requests for the same check-in; concurrent requests are not yet protected against duplicate generation.
- A fixed phrase check for crisis-like language in the source check-in's trigger or note. It returns a local resource response with `skipped_safety` status before calling the LLM. This is not a clinical detector.
- Stored insight metadata, including provider model, prompt version, token counts, latency, and status.
- API tests and GitHub Actions CI.

The stack is an npm workspace with Node.js, TypeScript, Fastify, Prisma, and PostgreSQL 16 on the backend; React and Vite on the frontend; and Docker Compose for local PostgreSQL. Groq integration uses the OpenAI SDK with Groq's API endpoint.

## Requirements

- Node.js 22+
- Docker Desktop (for this project's Postgres)
- A Groq API key is optional, needed only for live Groq insights ([console.groq.com](https://console.groq.com)). Fake mode and tests do not need a key.

## Local setup with the fake LLM provider

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
LLM_PROVIDER=fake npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

Open http://localhost:5173, register an account, save a check-in, and generate an insight. Fake mode returns a deterministic local response and makes **no external LLM API calls**, even if a Groq key is configured. It still stores check-ins and insights in PostgreSQL.

The browser calls the backend, and the backend connects to the configured database. Keep `VITE_API_URL` and `DATABASE_URL` pointed at local services for a local runtime. Dependency installation and Docker image downloads may require internet access during setup.

The command above uses POSIX shell syntax. Alternatively, set `LLM_PROVIDER=fake` in your local root `.env` and run `npm run dev:api`. Restart the API after changing its configuration. Never commit `.env`.

This project's Docker Postgres is on **localhost:5434** (database `recovery_coach`). Other Postgres servers on 5432/5433 are not this app.

```bash
curl http://localhost:3000/health
```

## Optional live Groq insights

Set `LLM_PROVIDER=groq` and supply `GROQ_API_KEY` through your environment or local root `.env`, then restart the API. An exported shell variable takes precedence over `.env`; remove or change any shell-level `LLM_PROVIDER=fake` override when switching providers.

Groq receives up to 14 check-ins through the source date: IDs, dates, urge scores, acted-on-urge flags, and trigger text. Notes are omitted, but trigger text may still contain sensitive information. The browser does not call Groq directly. Without a Groq key, insight generation returns an error; saving check-ins and calculating stats remain independent of the LLM.

## Configuration

The API loads the root `.env` without overriding existing process environment variables. No real keys or connection credentials are shown here.

| Variable | Purpose and behavior |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection URL for the API and Prisma. Local Docker PostgreSQL uses port 5434 and database `recovery_coach`. |
| `TEST_DATABASE_URL` | Optional dedicated test database URL. Otherwise tests derive a URL from `DATABASE_URL`, appending `_test` to the database name unless it already ends that way. Use a disposable database: tests delete application rows. |
| `LLM_PROVIDER` | `fake` selects local deterministic generation; `groq` selects live generation. Defaults to `groq`. Unsupported values fail API initialization outside test mode. |
| `NODE_ENV` | Defaults to development behavior. `test` forces the fake provider regardless of `LLM_PROVIDER`. `production` requires `JWT_SECRET` and enables secure authentication cookies. |
| `GROQ_API_KEY` | Secret required only for live Groq insights. Ignored in fake mode. |
| `LLM_MODEL` | Groq model identifier; defaults to `openai/gpt-oss-20b`. Ignored in fake mode. |
| `JWT_SECRET` | JWT signing secret. Required in production; development has an insecure local fallback. Supply your own secret for deployment. |
| `WEB_ORIGIN` | Browser origin allowed by API CORS; defaults to `http://localhost:5173`. |
| `PORT` | API listening port; defaults to `3000`. |
| `HOST` | API listening address; defaults to `0.0.0.0`. Use `127.0.0.1` to bind only to the local machine. |
| `VITE_API_URL` | Frontend API base URL; defaults to `http://localhost:3000`. Set through the web app's Vite environment, such as `VITE_API_URL=http://localhost:3000 npm run dev:web`. It is browser-visible and must not contain secrets. |

## Docs

- [Architecture](docs/architecture.md)
- [API](docs/api.md)

## CI

**CI** (continuous integration) is a machine that re-runs your checks on every push. Here that is GitHub Actions: `.github/workflows/api.yml`.

On push to `main` and on pull requests it installs Node 22, starts Postgres, then runs typecheck and `npm run test:api`. Tests force `LLM_PROVIDER=fake`, so GitHub never needs a Groq key. A green check on the commit means “this revision still typechecks and the API tests passed,” not “Groq is healthy.”

Locally (Docker Postgres on 5434 must be up):

```bash
npm run ci
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:api` | Start the Fastify API with reload |
| `npm run dev:web` | Start the React app |
| `npm run test:api` | API tests (needs Docker Postgres) |
| `npm run typecheck:api` | TypeScript check for API application code |
| `npm run typecheck:web` | TypeScript check for the React app |
| `npm run ci` | Same checks GitHub Actions runs |
| `npm run db:migrate` | Create/apply Prisma migrations |

## Repo layout

```
apps/api    Fastify + TypeScript API
apps/web    React UI
docs        Architecture and API notes
```

## Roadmap

The following work remains unfinished in the current codebase:

- Prevent concurrent insight requests from generating duplicate provider calls and stored results.
- Configure explicit provider timeouts, retries, and output limits; sanitize provider errors before returning or storing them.
- Add mocked Groq adapter tests for malformed output and provider failures, provider-selection tests, and more insight authorization and failure-path coverage.
- Add frontend tests and include API test files in static typechecking; the current API TypeScript configuration excludes tests.
- Validate that explicitly configured test databases are disposable before applying migrations or clearing rows.
- Add rate limiting for authentication and insight generation before public deployment.

## License

Licensed under the MIT License. See [LICENSE](LICENSE) for the terms.
