"use server";

import { signInPath } from "@/app/paths";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const getAuthOrRedirect = async () => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();
  
    if (error || !data?.user) {
        redirect(signInPath());   
    }

    return data.user;
};