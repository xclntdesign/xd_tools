"use server";

import { signInPath } from "@/app/paths";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(signInPath());
  };