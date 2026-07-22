import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import MemoryList from "@/components/MemoryList";
import DashboardHeading from "@/components/DashboardHeading";
import CopyButton from "@/components/CopyButton";

// The MCP server's connect URL (read server-side; unprefixed env vars aren't
// exposed to the client). Falls back to the production URL for local dev.
const MCP_URL =
  (process.env.MNEMOS_MCP_URL ?? "https://mnemos-server.vercel.app").replace(
    /\/+$/,
    "",
  ) + "/mcp";

type Memory = {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string;
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: memories, error } = await supabase
    .from("memories")
    .select("id, content, tags, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Memory[]>();

  return (
    <>
      <SignOutButton />
      <main className="min-h-screen w-full px-6 pt-28 pb-16 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <DashboardHeading />

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-[family-name:var(--font-jakarta)] text-sm text-white/50">
                Connect an AI to your memory:
              </span>
              <code className="whitespace-nowrap font-mono text-xs sm:text-sm text-white/80 underline decoration-white/30 underline-offset-4">
                {MCP_URL}
              </code>
              <CopyButton text={MCP_URL} />
            </div>
            <p className="font-[family-name:var(--font-jakarta)] text-xs text-white/40 mt-1.5 max-w-md">
              Paste into Claude or any MCP client — desktop connectors, the CLI,
              or a chatbot — to give it access to these memories.
            </p>
          </div>

          {error ? (
            <p className="font-[family-name:var(--font-jakarta)] text-red-400">
              Couldn&apos;t load your mnemes right now. Try refreshing.
            </p>
          ) : !memories || memories.length === 0 ? (
            <p className="font-[family-name:var(--font-jakarta)] text-gray-400">
              No mnemes yet.
            </p>
          ) : (
            <MemoryList initialMemories={memories} userId={user.id} />
          )}
        </div>
      </main>
    </>
  );
}
