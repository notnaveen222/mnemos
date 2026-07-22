"""Vercel entrypoint.

Vercel builds a FastAPI app named `app` into a single serverless function that
serves every route: the OAuth discovery/authorize/token/register/revoke
endpoints, our custom /oauth/finish, and /mcp.

The MCP SDK gives us a Starlette ASGI app via `mcp.streamable_http_app()`. We
wrap it in FastAPI so we can run its lifespan through Vercel's supported
startup/shutdown hooks — the lifespan starts the streamable-HTTP session
manager, which is required even in stateless mode.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from server import mcp

_mcp_app = mcp.streamable_http_app()


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with _mcp_app.router.lifespan_context(_mcp_app):
        yield


app = FastAPI(lifespan=lifespan)
app.mount("/", _mcp_app)
