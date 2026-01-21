"use server";

import { dashboardPath } from "@/app/paths";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type signInActionProps = {
  email: string;
  password: string;
}

export const signInAction = async ({ email, password }: signInActionProps) => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {status: false, message: "Invalid email address and/or password."}
  }

  return redirect(dashboardPath());
};