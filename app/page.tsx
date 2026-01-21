import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { dashboardPath, signInPath } from "./paths";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect(signInPath());
  } else {
    redirect(dashboardPath());
  }

  return (
    <></>
  );
}