import { createClient } from "@/lib/supabase/server";
import LandingSection from "@/components/LandingSection";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <LandingSection signedIn={!!session} />;
}
