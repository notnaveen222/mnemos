import { createClient } from "@/lib/supabase/server";
import LandingSection from "@/components/LandingSection";

// The MCP server's connect URL. Read server-side (unprefixed env vars are not
// exposed to the client) and passed to the client component as a prop. Falls
// back to the production URL for local dev without the env set.
const MCP_URL =
  (process.env.MNEMOS_MCP_URL ?? "https://mnemos-server.vercel.app").replace(
    /\/+$/,
    "",
  ) + "/mcp";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <LandingSection signedIn={!!session} mcpUrl={MCP_URL} />;
}
