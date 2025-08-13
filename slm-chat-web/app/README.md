# Shadowban Comment System (Next.js + Prisma + LLM Moderation)

This app demonstrates a comment system with shadow-banning, an admin moderation panel, and optional auto-moderation via an LLM service.

## Local development

Prereqs:
- Node 20+
- SQLite (bundled, no setup needed)

Steps:
```bash
# From slm-chat-web/app
npm ci
npm run dev
```
This seeds demo data and starts the dev server at http://localhost:3000.

Optional: run the LLM API locally to enable auto-moderation:
```bash
# In another terminal
cd ../../slm-api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export API_KEY=changeme
# Speed up for demos (no model load):
export TEST_MODE=1
uvicorn main:app --reload --port 8000
```
Back in the web app shell, set env if needed:
```bash
export SLM_API_URL=http://localhost:8000
export SLM_API_KEY=changeme
```

## Docker (run full stack)

From the repo root:
```bash
export SLM_API_KEY=changeme

docker compose up --build
```
- Web: http://localhost:3000
- LLM API docs: http://localhost:8000/docs

The web container waits for the API healthcheck, applies Prisma migrations, and runs the seed on start.

## Admin and user POV
- Admin page: http://localhost:3000/admin
- Switch users (top-right) to view as regular users.
- Admin can flag/unflag comments. Flagged comments are visible to the author and admin, hidden from other users.

## Tests
```bash
# From slm-chat-web/app
make e2e
```
This spins up the app on port 3010 and runs Playwright e2e tests, including:
- Create comment
- Hide flagged comment
- Admin flags comment
- Shadow-ban flow (author sees, others don’t)
- Auto-flag via LLM API
- Admin removes flag

## Configuration (web app)
- SLM_API_URL: LLM API base URL (default http://slm-api:8000 in Docker)
- SLM_API_KEY: API key for the LLM service
- SLM_MODERATION_ENABLED: true|false (default enabled)
- DATABASE_URL: sqlite path (default prisma/dev.db)

## Configuration (LLM API)
- API_KEY: token required by the API
- MODEL_NAME: model to load (default Qwen/Qwen1.5-1.8B)

## Deployment
- Any Docker host with docker compose:
```bash
docker compose -f docker-compose.yml up -d --build
```
- Unset `SLM_TEST_MODE` to use a real model and ensure sufficient resources.
- Put a reverse proxy (Nginx, Caddy, etc.) in front of the web service (port 3000).
- Persist volumes (`app-db`, `slm-cache`) to keep DB and model cache across restarts.
