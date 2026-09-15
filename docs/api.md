# API

Base URL (local): `http://localhost:3000`

Auth: after `register` or `login`, send the `access_token` cookie on later requests (`curl -c cookies.txt` then `-b cookies.txt`). JSON bodies use `Content-Type: application/json`.

## Health

`GET /health` → `{ "status": "ok", "service": "api" }`

## Auth

`POST /auth/register` body `{ "email", "password" }` → `201` `{ "user": { "id", "email" } }` + cookie. `409` if email exists.

`POST /auth/login` same body → `200` + cookie. `401` if invalid.

`POST /auth/logout` → `{ "ok": true }` and clears the cookie.

`GET /auth/me` → `{ "user": { "id", "email" } }`. `401` if not logged in.

## Check-ins

`POST /check-ins`

```json
{
  "occurredOn": "2026-09-14",
  "urgeIntensity": 4,
  "actedOnUrge": false,
  "trigger": "late night",
  "note": "optional"
}
```

`occurredOn` is `YYYY-MM-DD` (optional; defaults to UTC today). `urgeIntensity` is 0–10. `409` if that user already logged that day.

`GET /check-ins` → `{ "checkIns": [ ... ] }` newest first, max 30.

`GET /check-ins/stats` → SQL-derived:

```json
{
  "totalCheckIns": 3,
  "checkInStreak": 2,
  "last7AverageUrge": 5,
  "last7ActedOnUrge": 1,
  "last7DidNotAct": 1
}
```

## Insights

`POST /check-ins/:id/insight` generates (or returns) an insight for that check-in.

- `201` new `success` or `skipped_safety`
- `200` existing row for that check-in
- `404` check-in not found
- `503` Groq/provider failed (`insights.status = failed`)

`GET /insights/latest` → newest `success` or `skipped_safety`. `404` if none yet (`{ "error": "No insight yet" }`). That 404 is empty state, not a missing route.

Insight body:

```json
{
  "id": "...",
  "sourceCheckInId": "...",
  "promptVersion": "insight-v1",
  "model": "openai/gpt-oss-20b",
  "status": "success",
  "output": {
    "pattern": "...",
    "suggestedAction": "...",
    "encouragement": "..."
  },
  "disclaimer": "This is a support tool, not medical or therapeutic advice.",
  "createdAt": "..."
}
```

`skipped_safety` uses `model: "none"` and a fixed crisis-resource `output`. Groq is not called.
