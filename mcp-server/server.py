from datetime import datetime, timedelta

from mcp.server.fastmcp import FastMCP
from db import (
    insert_memory,
    get_all_memories,
    get_memories_by_time_range,
    search_memories_by_meaning,
    delete_memory,
)

mcp = FastMCP(
    "mnemos",
    instructions=(
        "Provides tools that help LLMs store {remember(content, tags)}, "
        "retrieve {recall(query, tag)}, retrieve by time {recall_by_time(around_iso, window_minutes)}, "
        "retrieve by meaning {recall_semantic(query)}, "
        "and delete {forget(memory_id)} context."
    ),
)


@mcp.tool()
def remember(content: str, tags: list[str] | None = None) -> str:
    """Save a fact to the user's persistent memory so it can be recalled later.
    Optionally save it under one or more tags (e.g. ["work", "urgent"]) for scoped recall later."""
    saved = insert_memory(content, tags)
    return f"Saved (id: {saved['id']})."


@mcp.tool()
def recall(query: str, tag: str | None = None) -> str:
    """Search the user's saved memories for anything relevant to the query and return the matches.
    If a tag is given, only search memories that include that tag."""
    query_words = query.lower().split()
    matches = [
        m for m in get_all_memories(tag)
        if any(word in m["content"].lower() for word in query_words)
    ]
    if not matches:
        return "No matching memories found."
    return "\n".join(f"- [{m['id']}] {m['content']}" for m in matches)


@mcp.tool()
def recall_by_time(around_iso: str, window_minutes: int = 60) -> str:
    """Find memories saved around a specific point in time.
    `around_iso` must be an ISO 8601 timestamp (e.g. "2026-07-06T14:00:00") -
    convert any relative time the user mentions (e.g. "around 2 o'clock", "yesterday morning")
    into this format yourself before calling. `window_minutes` is how far before/after to search
    (default 60 minutes on each side)."""
    around = datetime.fromisoformat(around_iso)
    window = timedelta(minutes=window_minutes)
    start = (around - window).isoformat()
    end = (around + window).isoformat()
    matches = get_memories_by_time_range(start, end)
    if not matches:
        return "No memories found in that time range."
    return "\n".join(f"- [{m['id']}] ({m['created_at']}) {m['content']}" for m in matches)


@mcp.tool()
def recall_semantic(query: str) -> str:
    """Search the user's saved memories by meaning rather than exact keywords.
    Use this when the query is conceptually related to a memory but doesn't share its words
    (e.g. query "furry friend" should find a memory about "my cat")."""
    matches = search_memories_by_meaning(query)
    if not matches:
        return "No matching memories found."
    return "\n".join(
        f"- [{m['id']}] ({m['similarity']:.2f}) {m['content']}" for m in matches
    )


@mcp.tool()
def forget(memory_id: str) -> str:
    """Delete a saved memory by its id. Use recall first to find the id if you don't have it."""
    deleted = delete_memory(memory_id)
    return "Deleted." if deleted else "No memory found with that id."


if __name__ == "__main__":
    mcp.run()
