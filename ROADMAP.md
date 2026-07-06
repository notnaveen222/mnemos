# persist — MCP Memory Server (Roadmap)

> Working name: **persist** (not final). A portable, cross-app memory for AI
> assistants. "Save it in persist" in one app → "get it from persist" in another.

This file is the running notebook for the project so we don't forget decisions
or the features we're deferring. Update it as things change.

---

## 1. The vision (what we're actually building)

A **memory server** that any MCP-compatible AI client (Claude Desktop, ChatGPT
connectors, etc.) can connect to. The AI can:

- **remember(content)** — store a fact for later.
- **recall(query)** — find relevant stored facts (later: by *meaning*, not just keywords).
- **forget(id or query)** — delete a fact.

The resume angle: built-in memory (ChatGPT's, etc.) is locked inside one app.
**persist is portable infrastructure** — one memory that follows the user across
every AI app that speaks MCP.

Nice-to-have behaviors the user wants (deferred, see backlog):
- **Tags / a name to link a memory** (e.g. "remember this under *xyz*"), so recall
  can be scoped ("get context from persist about *xyz*").
- **Time-based recall** ("what did I save around 2 o'clock?") — just a timestamp column + query.
- **A website** where users sign up and browse/manage their stored memories.

---

## 2. Decisions locked in

| Decision | Choice | Why |
|---|---|---|
| Language | **Python** (official MCP SDK, FastMCP style) | User's choice; good Python resume piece |
| Database | **Supabase only (Postgres)** | One service for accounts + memory text + tags + timestamps + (later) vector search via `pgvector`. User already knows Supabase from HealthPilot. |
| Storing big memory text in SQL? | **Fine** | Postgres `text` = up to ~1 GB/value, TOAST handles large values efficiently. Memories are tiny by comparison. |
| Build approach | **Local first → then remote** | Run locally with Claude Desktop (no hosting/accounts) to learn the mechanics, then lift the same tools to a hosted server with real logins. |
| Hosting (later) | **Not Render** (spins down). Leaning Railway or Fly.io | Always-on, cheap, good for a long-running Python process. Decide at the "go remote" step. |

---

## 3. Architecture

### Now (local)
```
Claude Desktop  ──stdio──►  server.py (Python, on your PC)  ──►  in-memory dict
```
- "stdio" = Claude Desktop launches the Python program and talks to it over its
  input/output pipes. No internet, no hosting, no login.
- One hardcoded user. Data lives in a plain Python variable (gone on restart).

### Later (remote — the real dream)
```
ChatGPT ─┐
Claude   ─┼──HTTPS──►  hosted server.py  ──►  Supabase (Postgres)
Website  ─┘                                     ├─ users (Supabase Auth)
                                                ├─ memories (text, tags, timestamps)
                                                └─ embeddings (pgvector, for semantic recall)
```
- Same `remember`/`recall`/`forget` tools — we swap the *transport* (stdio → HTTP)
  and the *storage* (dict → Supabase), and add real per-user auth.
- ChatGPT + remote Claude can only reach a **remote HTTPS** server — that's why
  hosting + accounts are required for the cross-app vision.

---

## 4. Data model (target, for the Supabase phase)

`memories` table (rough shape — refine when we build it):

| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| user_id | uuid | FK to auth user; per-user isolation via RLS |
| content | text | the memory itself |
| tags / name | text[] or text | for "remember under xyz" / scoped recall |
| created_at | timestamptz | powers time-based recall |
| expires_at | timestamptz null | null = permanent; set = temporary/expiring |
| embedding | vector (pgvector) | added in the semantic-search phase |

---

## 5. Build plan (phased — replaces the old build order)

Each phase ends with something that visibly works.

- [ ] **Phase 1 — Local core.** `remember` + `recall` tools, storage in an
      in-memory Python dict, one hardcoded user, dumb keyword matching for recall.
      Connect to Claude Desktop and watch it work. *(No DB, no embeddings.)*
- [ ] **Phase 2 — Supabase persistence.** Swap the dict for a `memories` table so
      data survives restarts. Add `forget`.
- [ ] **Phase 3 — Real per-user.** Supabase Auth; each user gets their own memories
      (RLS enforces isolation). Two users = two separate memory sets.
- [ ] **Phase 4 — Tags + time.** "Remember under *xyz*", scoped recall, and
      time-based recall ("around 2 o'clock").
- [ ] **Phase 5 — Semantic recall.** Add `pgvector` embeddings; recall finds by
      *meaning*, not keywords. (Embedding model TBD — decide free/local vs API.)
- [ ] **Phase 6 — Go remote.** Switch transport to HTTP, deploy (Railway/Fly.io),
      HTTPS. Now reachable from ChatGPT + Claude anywhere.
- [ ] **Phase 7 — Website.** Sign up / log in / browse & manage stored memories.
- [ ] **Phase 8 — Expiry + polish.** Auto-expiring temporary memories, README,
      final resume write-up.

---

## 6. Backlog / deferred features (don't forget)

- Tags & named memories for scoped recall ("about xyz").
- Time-based recall queries.
- Semantic search (pgvector); pick an embedding approach when we get there.
- Auto-expiring/temporary memories (expires_at + a cleanup query or index).
- Website for account creation + browsing memories.
- Deploy to a no-spin-down host (Railway / Fly.io).
- ChatGPT connector support (needs remote HTTPS server).
- `forget` tool (delete by id or by matching query).

---

## 7. Open decisions (revisit later, not blocking Phase 1)

- Final project name (persist? something else?).
- Embedding model for semantic search: local/free (e.g. sentence-transformers)
  vs a hosted embedding API. Decide at Phase 5.
- Exact hosting choice (Railway vs Fly.io). Decide at Phase 6.
- Website framework. Decide at Phase 7.

---

## 8. Environment notes (this machine)

- Python: `py` launcher → 3.13.7 (also `python` → 3.10.11). Use `py`.
- `uv` not installed; using `pip` + a virtual environment (venv).
- Claude Desktop: config folder `%APPDATA%\Claude\` not found → **likely not
  installed yet**. Needed to test Phase 1. Confirm / install.
