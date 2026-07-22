"""OAuth 2.1 Authorization Server for the mnemos MCP server.

The MCP Python SDK handles the HTTP surface (the /authorize, /token, /register,
/revoke routes, PKCE verification, and Dynamic Client Registration). This class
only supplies the storage + business logic, backed by three Supabase tables:
oauth_clients, oauth_codes, oauth_tokens.

Identity itself is delegated to Supabase Auth: the browser leg of /authorize
redirects to the Next.js site, which confirms who the user is and hands us a
verified user_id (see server.py's /oauth/finish route). We mint our own codes
and tokens on top of that identity.
"""

import os
import secrets
import time

from mcp.server.auth.provider import (
    AccessToken,
    AuthorizationCode,
    AuthorizationParams,
    OAuthAuthorizationServerProvider,
    RefreshToken,
    construct_redirect_uri,
)
from mcp.shared.auth import OAuthClientInformationFull, OAuthToken

from db import supabase

CODE_TTL_SECONDS = 600  # authorization codes are single-use and short-lived
ACCESS_TOKEN_TTL_SECONDS = 3600
SITE_URL = os.environ["MNEMOS_SITE_URL"].rstrip("/")  # e.g. https://mnemos.app


class SupabaseOAuthProvider(
    OAuthAuthorizationServerProvider[AuthorizationCode, RefreshToken, AccessToken]
):
    # --- Dynamic Client Registration ---

    async def get_client(self, client_id: str) -> OAuthClientInformationFull | None:
        row = (
            supabase.table("oauth_clients")
            .select("data")
            .eq("client_id", client_id)
            .execute()
        )
        if not row.data:
            return None
        return OAuthClientInformationFull.model_validate(row.data[0]["data"])

    async def register_client(self, client_info: OAuthClientInformationFull) -> None:
        supabase.table("oauth_clients").upsert(
            {
                "client_id": client_info.client_id,
                "data": client_info.model_dump(mode="json"),
            }
        ).execute()

    # --- Authorization: hand the browser off to the site to establish identity ---

    async def authorize(
        self, client: OAuthClientInformationFull, params: AuthorizationParams
    ) -> str:
        return construct_redirect_uri(
            f"{SITE_URL}/oauth/consent",
            client_id=client.client_id,
            redirect_uri=str(params.redirect_uri),
            state=params.state,
            code_challenge=params.code_challenge,
            scope=" ".join(params.scopes or []),
        )

    # --- Authorization codes (created by /oauth/finish, consumed here) ---

    async def load_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: str
    ) -> AuthorizationCode | None:
        row = (
            supabase.table("oauth_codes")
            .select("*")
            .eq("code", authorization_code)
            .eq("client_id", client.client_id)
            .execute()
        )
        if not row.data:
            return None
        r = row.data[0]
        if r["expires_at"] < time.time():
            supabase.table("oauth_codes").delete().eq("code", r["code"]).execute()
            return None
        return AuthorizationCode(
            code=r["code"],
            scopes=r["scopes"] or [],
            expires_at=float(r["expires_at"]),
            client_id=r["client_id"],
            code_challenge=r["code_challenge"],
            redirect_uri=r["redirect_uri"],
            redirect_uri_provided_explicitly=True,
            subject=r["user_id"],
        )

    async def exchange_authorization_code(
        self, client: OAuthClientInformationFull, authorization_code: AuthorizationCode
    ) -> OAuthToken:
        access_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + ACCESS_TOKEN_TTL_SECONDS
        supabase.table("oauth_tokens").insert(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "client_id": client.client_id,
                "user_id": authorization_code.subject,
                "scopes": authorization_code.scopes,
                "expires_at": expires_at,
            }
        ).execute()
        # Codes are single-use.
        supabase.table("oauth_codes").delete().eq(
            "code", authorization_code.code
        ).execute()
        return OAuthToken(
            access_token=access_token,
            token_type="Bearer",
            expires_in=ACCESS_TOKEN_TTL_SECONDS,
            refresh_token=refresh_token,
            scope=" ".join(authorization_code.scopes) or None,
        )

    # --- Refresh tokens (rotated on every use) ---

    async def load_refresh_token(
        self, client: OAuthClientInformationFull, refresh_token: str
    ) -> RefreshToken | None:
        row = (
            supabase.table("oauth_tokens")
            .select("*")
            .eq("refresh_token", refresh_token)
            .eq("client_id", client.client_id)
            .execute()
        )
        if not row.data:
            return None
        r = row.data[0]
        return RefreshToken(
            token=r["refresh_token"],
            client_id=r["client_id"],
            scopes=r["scopes"] or [],
            subject=r["user_id"],
        )

    async def exchange_refresh_token(
        self,
        client: OAuthClientInformationFull,
        refresh_token: RefreshToken,
        scopes: list[str],
    ) -> OAuthToken:
        new_access = secrets.token_urlsafe(32)
        new_refresh = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + ACCESS_TOKEN_TTL_SECONDS
        # Narrow scopes if the client requested a subset, else keep existing.
        granted = scopes if scopes else refresh_token.scopes
        supabase.table("oauth_tokens").update(
            {
                "access_token": new_access,
                "refresh_token": new_refresh,
                "scopes": granted,
                "expires_at": expires_at,
            }
        ).eq("refresh_token", refresh_token.token).execute()
        return OAuthToken(
            access_token=new_access,
            token_type="Bearer",
            expires_in=ACCESS_TOKEN_TTL_SECONDS,
            refresh_token=new_refresh,
            scope=" ".join(granted) or None,
        )

    # --- Access tokens (verified on every MCP request) ---

    async def load_access_token(self, token: str) -> AccessToken | None:
        row = (
            supabase.table("oauth_tokens")
            .select("*")
            .eq("access_token", token)
            .execute()
        )
        if not row.data:
            return None
        r = row.data[0]
        if r["expires_at"] < time.time():
            return None
        return AccessToken(
            token=token,
            client_id=r["client_id"],
            scopes=r["scopes"] or [],
            expires_at=int(r["expires_at"]),
            subject=r["user_id"],
        )

    async def revoke_token(self, token: AccessToken | RefreshToken) -> None:
        # Revoke both halves regardless of which token string we were handed.
        supabase.table("oauth_tokens").delete().eq(
            "access_token", token.token
        ).execute()
        supabase.table("oauth_tokens").delete().eq(
            "refresh_token", token.token
        ).execute()
