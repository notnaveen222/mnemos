import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import MemoryList from "@/components/MemoryList";
import DashboardHeading from "@/components/DashboardHeading";

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
