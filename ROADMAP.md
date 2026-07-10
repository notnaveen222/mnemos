# mnemos — Build Plan

A portable, remote MCP memory server. Any MCP client (Claude, ChatGPT, etc.)
connects to one hosted HTTP endpoint, authenticates as a real user via OAuth,
and gets `remember` / `recall` / `forget` tools scoped to that user's own data.

---

## Done

- [x] `remember`, `recall`, `recall_by_time`, `recall_semantic`, `forget` tools
      (`mcp-server/server.py` + `db.py`), backed by Supabase Postgres + pgvector.
- [x] Website (`site/`): Next.js + Tailwind, Supabase Auth w/ Google OAuth,
      dashboard (list/delete memories), docs page, deployed on Vercel.

---

## To build

### 1. Multi-user data model
- [ ] Add `user_id` column to `memories`.
- [ ] Add tables for the OAuth layer below: `oauth_clients`, `oauth_codes`,
      `oauth_tokens` (access + refresh).

### 2. HTTP transport
- [ ] Switch `server.py` from `mcp.run()` (stdio) to streamable HTTP transport.
- [ ] Host the Python server somewhere always-on — Railway or Fly.io (not
      Vercel; that's for the Next.js site, not a long-running Python process).
- [ ] Get it live over HTTPS (e.g. `mcp.mnemos.app`).

### 3. Real MCP OAuth
- [ ] Serve OAuth Protected Resource Metadata
      (`/.well-known/oauth-protected-resource`) per the MCP auth spec.
- [ ] Minimal Authorization Server, identity backed by existing Supabase Auth:
  - `/authorize` — reuse the existing Supabase session/login, then redirect
    back with a code.
  - `/token` — exchange code (PKCE) for access + refresh tokens.
  - `/register` — Dynamic Client Registration, so Claude/ChatGPT can register
    themselves with no manual setup.
- [ ] Auth middleware on the MCP HTTP endpoint: validate bearer token →
      resolve `user_id` → attach to request context.
- [ ] Update all 5 tools in `server.py` / `db.py` to filter/write using the
      resolved `user_id` instead of querying globally.

### 4. Cutover
- [ ] Add the new HTTPS URL as a remote MCP server in Claude, confirm the
      OAuth consent screen appears and all 5 tools work end-to-end per-user.
- [ ] Retire the local stdio-only setup.

---

## Backlog (not scheduled)

- Burn-after-read memory (see `FEATURE_IDEAS.md`).
- Auto-expiring/temporary memories.
- Tags / time-based recall refinements.
