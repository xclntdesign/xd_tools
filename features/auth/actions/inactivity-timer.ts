// hooks/useInactivityLogout.ts
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

type UseInactivityLogoutOptions = {
  supabase: SupabaseClient;
  /** Inactivity time in ms (default: 15 minutes) */
  timeoutMs?: number;
  /** Called after signOut succeeds (e.g. redirect to /login) */
  onLogout?: () => void;
  /** Turn off/on the tracking (default: true) */
  enabled?: boolean;
};

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

export function useInactivityLogout({
  supabase,
  timeoutMs = 15 * 60 * 1000,
  onLogout,
  enabled = true,
}: UseInactivityLogoutOptions) {
  const timerId = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerId.current !== null) {
      window.clearTimeout(timerId.current);
      timerId.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();

    timerId.current = window.setTimeout(async () => {
      // Sign the user out on inactivity
      await supabase.auth.signOut();
      onLogout?.();
    }, timeoutMs);
  }, [clearTimer, timeoutMs, supabase, onLogout]);

  const handleActivity = useCallback(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    // Attach global listeners
    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity)
    );

    // Start the initial timer
    startTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity)
      );
      clearTimer();
    };
  }, [enabled, handleActivity, startTimer, clearTimer]);
}
