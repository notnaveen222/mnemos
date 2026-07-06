import { createClient } from "@/lib/supabase/server";
import LandingSection from "@/components/LandingSection";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingSection signedIn={!!user} />;
}
