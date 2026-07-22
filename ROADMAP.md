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

### Multi-user data model
- [x] `memories.user_id` (already present, FK to auth.users).
- [x] OAuth tables: `oauth_clients`, `oauth_codes`, `oauth_tokens` (RLS on,
      no policies → service-role only).
- [x] `match_memories` RPC now takes `match_user_id` and filters by it; old
      unscoped 2-arg version dropped.

### HTTP transport
- [x] `server.py` runs `streamable-http` transport (was stdio).
- [x] Per-request user resolution via `_current_user_id()`; all 5 tools and all
      `db.py` functions scoped by `user_id`.

### Real MCP OAuth
- [x] OAuth discovery, `/authorize` `/token` `/register` (DCR) `/revoke` — all
      SDK-served; `SupabaseOAuthProvider` supplies the storage/business logic.
- [x] `/oauth/finish` custom route: verifies a Supabase session token, mints a
      single-use auth code bound to the real user.
- [x] Next.js `/oauth/consent` bridge + `next=` passthrough in `/auth/callback`
      and the landing sign-in.
- [x] Smoke-tested locally: discovery, DCR, `/authorize`→consent redirect, and
      401+discovery on unauthenticated MCP calls all verified.

### Deploy
- [x] `requirements.txt`, `.env.example`, systemd unit, Caddyfile, `DEPLOY.md`
      (GCP e2-micro Always Free + Caddy TLS).
- [ ] Provision the GCP VM, DNS, and run through `DEPLOY.md` for real.
- [ ] Add `MNEMOS_MCP_URL` to Vercel and redeploy the site.

### Cutover
- [ ] Add the HTTPS MCP URL in Claude, confirm consent + per-user isolation
      end-to-end.
- [ ] Retire the local stdio-only setup.

---

## Open decision

- [ ] **RLS on `public.memories`** is still disabled. The site reads via the
      publishable key + user session, so enabling RLS requires a policy like
      `user_id = auth.uid()` for select/insert/update/delete, or the dashboard
      breaks. The Python server uses the service key (bypasses RLS) either way.
      SQL is ready to apply on your go.

---

## Backlog (not scheduled)

- Burn-after-read memory (see `FEATURE_IDEAS.md`).
- Auto-expiring/temporary memories.
- Tags / time-based recall refinements.
