"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      className="font-[family-name:var(--font-jakarta)] fixed top-6 right-6 sm:top-8 sm:right-10 text-sm font-medium text-white hover:text-gray-300 transition-colors duration-200 cursor-pointer z-10"
    >
      Sign out
    </button>
  );
}
