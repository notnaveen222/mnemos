import os
import secrets
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.auth.provider import construct_redirect_uri
from mcp.server.auth.settings import (
    AuthSettings,
    ClientRegistrationOptions,
    RevocationOptions,
)
from mcp.server.transport_security import TransportSecuritySettings
from starlette.requests import Request
from starlette.responses import PlainTextResponse, RedirectResponse

from auth_provider import SupabaseOAuthProvider, CODE_TTL_SECONDS
from db import (
    supabase,
    insert_memory,
    get_all_memories,
    get_memories_by_time_range,
    search_memories_by_meaning,
    delete_memory,
)

load_dotenv()

# Public HTTPS URL this server is reachable at (e.g. https://mcp.mnemos.app).
# The server acts as its own OAuth Authorization Server + Resource Server.
MCP_URL = os.environ["MNEMOS_MCP_URL"].rstrip("/")
_host_header = urlparse(MCP_URL).netloc  # e.g. mcp.mnemos.app

mcp = FastMCP(
    "mnemos",
    instructions=(
        "Provides tools that help LLMs store {remember(content, tags)}, "
        "retrieve {recall(query, tag)}, retrieve by time {recall_by_time(around_iso, window_minutes)}, "
        "retrieve by meaning {recall_semantic(query)}, "
        "and delete {forget(memory_id)} context."
    ),
    host="0.0.0.0",
    port=int(os.environ.get("PORT", "8000")),
    # Serverless-friendly: no per-connection session state, plain JSON responses
    # instead of SSE streams. Each request stands on its own (see app.py).
    stateless_http=True,
    json_response=True,
    auth=AuthSettings(
        issuer_url=MCP_URL,
        resource_server_url=MCP_URL,
        client_registration_options=ClientRegistrationOptions(enabled=True),
        revocation_options=RevocationOptions(enabled=True),
    ),
    auth_server_provider=SupabaseOAuthProvider(),
    # Requests arrive proxied under the real domain, so allow that Host/Origin.
    transport_security=TransportSecuritySettings(
        allowed_hosts=[_host_header, "127.0.0.1:*", "localhost:*"],
        allowed_origins=[MCP_URL, "http://127.0.0.1:*", "http://localhost:*"],
    ),
)


def _current_user_id() -> str:
    """Resolve the authenticated user for the current MCP request."""
    token = get_access_token()
    if token is None or token.subject is None:
        raise RuntimeError("No authenticated user for this request.")
    return token.subject


@mcp.custom_route("/oauth/finish", methods=["GET"])
async def oauth_finish(request: Request):
    """Callback from the Next.js site once the user's identity is confirmed.

    The site forwards the OAuth params plus a Supabase session access_token.
    We independently verify that token against Supabase (never trust a passed
    user_id), mint a single-use authorization code bound to the verified user,
    and redirect back to the MCP client's redirect_uri with ?code=...&state=...
    """
    params = request.query_params
    access_token = params.get("access_token")
    if not access_token:
        return PlainTextResponse("Missing session token", status_code=400)

    try:
        user_resp = supabase.auth.get_user(access_token)
    except Exception:
        return PlainTextResponse("Invalid or expired session", status_code=401)
    if not user_resp or not user_resp.user:
        return PlainTextResponse("Invalid or expired session", status_code=401)

    required = ("client_id", "redirect_uri", "code_challenge")
    if any(not params.get(k) for k in required):
        return PlainTextResponse("Missing OAuth parameters", status_code=400)

    code = secrets.token_urlsafe(32)
    scope = params.get("scope", "")
    supabase.table("oauth_codes").insert(
        {
            "code": code,
            "client_id": params["client_id"],
            "user_id": user_resp.user.id,
            "code_challenge": params["code_challenge"],
            "redirect_uri": params["redirect_uri"],
            "scopes": scope.split() if scope else [],
            "expires_at": int(time.time()) + CODE_TTL_SECONDS,
        }
    ).execute()

    return RedirectResponse(
        construct_redirect_uri(
            params["redirect_uri"], code=code, state=params.get("state")
        )
    )


@mcp.tool()
def remember(content: str, tags: list[str] | None = None) -> str:
    """Save a fact to the user's persistent memory so it can be recalled later.
    Optionally save it under one or more tags (e.g. ["work", "urgent"]) for scoped recall later."""
    saved = insert_memory(_current_user_id(), content, tags)
    return f"Saved (id: {saved['id']})."


@mcp.tool()
def recall(query: str, tag: str | None = None) -> str:
    """Search the user's saved memories for anything relevant to the query and return the matches.
    If a tag is given, only search memories that include that tag."""
    query_words = query.lower().split()
    matches = [
        m for m in get_all_memories(_current_user_id(), tag)
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
    matches = get_memories_by_time_range(_current_user_id(), start, end)
    if not matches:
        return "No memories found in that time range."
    return "\n".join(f"- [{m['id']}] ({m['created_at']}) {m['content']}" for m in matches)


@mcp.tool()
def recall_semantic(query: str) -> str:
    """Search the user's saved memories by meaning rather than exact keywords.
    Use this when the query is conceptually related to a memory but doesn't share its words
    (e.g. query "furry friend" should find a memory about "my cat")."""
    matches = search_memories_by_meaning(_current_user_id(), query)
    if not matches:
        return "No matching memories found."
    return "\n".join(
        f"- [{m['id']}] ({m['similarity']:.2f}) {m['content']}" for m in matches
    )


@mcp.tool()
def forget(memory_id: str) -> str:
    """Delete a saved memory by its id. Use recall first to find the id if you don't have it."""
    deleted = delete_memory(_current_user_id(), memory_id)
    return "Deleted." if deleted else "No memory found with that id."


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
