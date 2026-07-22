import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Bridge between an MCP client's OAuth flow and our Supabase identity.
//
// The mnemos MCP server's /authorize redirects the browser here with the OAuth
// params (client_id, redirect_uri, state, code_challenge, scope). We confirm
// the visitor is signed into mnemos, then hand a verified Supabase session
// token back to the MCP server's /oauth/finish, which mints the auth code.
//
// If the visitor isn't signed in yet, we bounce them through the normal Google
// login and come straight back here (via ?next=) once they are.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const next = `/oauth/consent?${searchParams.toString()}`;
    return NextResponse.redirect(`${origin}/?next=${encodeURIComponent(next)}`);
  }

  const mcpBase = process.env.MNEMOS_MCP_URL;
  if (!mcpBase) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const finish = new URL(`${mcpBase.replace(/\/$/, "")}/oauth/finish`);
  for (const [key, value] of searchParams) {
    finish.searchParams.set(key, value);
  }
  // The MCP server independently verifies this token against Supabase before
  // trusting the user's identity, so it is never taken at face value.
  finish.searchParams.set("access_token", session.access_token);

  return NextResponse.redirect(finish.toString());
}
