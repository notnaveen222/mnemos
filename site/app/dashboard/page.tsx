import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

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
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white mb-8">
            Your memories
          </h1>

          {error ? (
            <p className="font-[family-name:var(--font-jakarta)] text-red-400">
              Couldn&apos;t load your memories right now. Try refreshing.
            </p>
          ) : !memories || memories.length === 0 ? (
            <p className="font-[family-name:var(--font-jakarta)] text-gray-400">
              Nothing saved yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {memories.map((memory) => (
                <li
                  key={memory.id}
                  className="font-[family-name:var(--font-jakarta)] rounded-xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <p className="text-white">{memory.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(memory.created_at).toLocaleString()}</span>
                    {memory.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
