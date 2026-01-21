"use client";

import { createClient } from "@supabase/supabase-js";
// import type { Database } from "../types/supabase"; // if you generated types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowserClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);
