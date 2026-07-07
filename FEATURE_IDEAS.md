# Feature ideas

Not scheduled into a phase yet. Just a running list of ideas to revisit later.

## Read-once memory (burn after read)

A memory that gets deleted automatically the moment any MCP client reads it back, not just after a fixed expiry time. More temporary than the planned auto-expiring memories (see ROADMAP.md Phase 8) - this one dies on first read, not after a timer.

Rough shape: a new tool, something like `remember_once(content)`, or a flag on the existing `remember` tool (e.g. `burn_after_read: true`). When `recall` (or any read path) returns a memory saved this way, it deletes that row right after returning it, so it can only ever be recalled a single time by a single AI, then it is gone.

Useful for things like one-time codes, a fact you only want handed off once, or anything you deliberately do not want to persist beyond a single use.
