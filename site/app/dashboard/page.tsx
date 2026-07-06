import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import MemoryList from "@/components/MemoryList";

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
          <div className="flex items-baseline gap-2 mb-8">
            <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">
              Your Mnemes
            </h1>
            <span className="font-[family-name:var(--font-jakarta)] text-sm text-white/40">
              (n.) memory
            </span>
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
