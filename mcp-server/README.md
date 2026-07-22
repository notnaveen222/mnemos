# mnemos — MCP memory server

A remote MCP server exposing `remember` / `recall` / `recall_by_time` /
`recall_semantic` / `forget`, scoped per authenticated user. Backed by Supabase
Postgres + pgvector, with embeddings from Google's Gemini API. Runs as a single
serverless function on **Vercel**.

See [`../DEPLOY.md`](../DEPLOY.md) for full deploy steps.

## Layout

| File              | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `server.py`       | The MCP server: tools + OAuth wiring (also runnable locally).  |
| `db.py`           | Supabase access + Gemini embeddings.                           |
| `auth_provider.py`| OAuth 2.1 storage/business logic (Supabase-backed).            |
| `app.py`          | Vercel ASGI entrypoint (wraps `server.mcp`).                   |
| `vercel.json`     | Serverless function config (`maxDuration`).                    |
| `pyproject.toml`  | Pins the Vercel entrypoint to `app:app`.                       |
| `Dockerfile`      | Optional — only for a container host (e.g. Render). Vercel ignores it. |

## Run locally

```bash
python -m venv .venv && . .venv/Scripts/activate   # or .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real values
python server.py       # serves streamable-HTTP on $PORT (default 8000)
```
