# Deploying mnemos online

Everything runs on free tiers, no credit card:

- **Site** (`site/`) — the Next.js login/dashboard. Already on Vercel
  (`mnemos-mcp.vercel.app`). Only needs one new env var.
- **MCP server** (`mcp-server/`) — a Python app that Claude connects to. Runs
  as a serverless function on its **own** Vercel project.
- **Embeddings** — Google Gemini API (free tier).
- **Database** — Supabase (already provisioned).

The two Vercel projects come from the **same GitHub repo**, split by root
directory: the site from `site/`, the MCP server from `mcp-server/`.

---

## 1. Get a Gemini API key

https://aistudio.google.com/apikey → sign in with Google → **Create API key**.
No credit card. Copy it; it's used as `GEMINI_API_KEY`.

---

## 2. Deploy the MCP server (new Vercel project)

1. Push this repo to GitHub (if not already).
2. Vercel → **Add New… → Project** → import the repo.
3. Set **Root Directory** to `mcp-server`.
4. Name it so the URL is predictable, e.g. project `mnemos-server` →
   `https://mnemos-server.vercel.app`. That URL is your `MNEMOS_MCP_URL`.
5. Add **Environment Variables** (Production):

   | Key                    | Value                                             |
   | ---------------------- | ------------------------------------------------- |
   | `SUPABASE_URL`         | your Supabase project URL                         |
   | `SUPABASE_SERVICE_KEY` | service-role key (server-only; bypasses RLS)      |
   | `GEMINI_API_KEY`       | from step 1                                       |
   | `MNEMOS_MCP_URL`       | this project's URL, e.g. `https://mnemos-server.vercel.app` |
   | `MNEMOS_SITE_URL`      | `https://mnemos-mcp.vercel.app`                   |

6. **Deploy.** Vercel builds `mcp-server/` into one function (see
   `app.py` / `vercel.json`) serving every route.
7. Verify it's live:
   `https://mnemos-server.vercel.app/.well-known/oauth-protected-resource`
   should return JSON.

> Vercel serves the whole ASGI app from `app.py` (entrypoint pinned in
> `pyproject.toml`). No local model — embeddings are an API call — so the
> bundle is small and cold starts are fast.

---

## 3. Point the site at the MCP server

On the **existing site** Vercel project, add one env var and redeploy:

| Key              | Value                            |
| ---------------- | -------------------------------- |
| `MNEMOS_MCP_URL` | `https://mnemos-server.vercel.app` |

This is what `site/app/oauth/consent/route.ts` uses to hand the verified
session back to the MCP server's `/oauth/finish`.

---

## 4. Supabase config

**Redirect URLs** (Authentication → URL Configuration) — Google login bounces
through these:

- `https://mnemos-mcp.vercel.app/auth/callback`
- `https://mnemos-mcp.vercel.app/**` (covers `/oauth/consent`)

**Embedding dimension** — the `memories.embedding` column is `vector(768)` to
match Gemini `gemini-embedding-001` at 768 dims. (Applied via migration
`switch_embeddings_to_gemini_768`.)

---

## 5. Connect from Claude

Add `https://mnemos-server.vercel.app/mcp` as a remote MCP server in Claude.
Claude discovers the OAuth endpoints, registers itself (DCR), opens the consent
flow in your browser (Google login if needed), and gets a per-user token. All
five tools then operate scoped to that account.

---

## Optional: container host (Render) fallback

If you ever want an always-on host instead of serverless, `mcp-server/`
includes a `Dockerfile` that runs the server the standard way. Render's free
tier works (512 MB is plenty without a local model), but it sleeps after 15 min
idle with a slow cold start — which is why Vercel is the default here.
