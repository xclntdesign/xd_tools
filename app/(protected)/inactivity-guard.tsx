"use client";

import { useInactivityLogout } from "@/features/auth/actions/inactivity-timer";
import { supabaseBrowserClient } from "@/lib/supabase/inactivity-client";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { signInPath } from "../paths";

type Props = {
  children: ReactNode;
};

export default function InactivityGuard({ children }: Props) {
  const router = useRouter();

  useInactivityLogout({
    supabase: supabaseBrowserClient,
    timeoutMs: 120 * 60 * 1000, // 120 minutes
    onLogout: async() => {
        await fetch("/api/users/logout?reason=inactivity")
        router.push(signInPath());
    },
  });

  return <>{children}</>;
}
