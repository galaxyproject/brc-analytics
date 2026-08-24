import { useAuth } from "@repo/shared/providers/authentication/provider";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseUserResourceReturn } from "./types";

/**
 * Loads a list of account-scoped records, gated on auth being ready.
 *
 * Pass a stable fetcher (useCallback or a module-level function): the hook
 * refetches whenever its identity changes.
 * @param fetcher - Returns the user's records.
 * @returns list state, an error, and reload/setItems handles.
 */
export function useUserResource<T>(
  fetcher: () => Promise<T[]>
): UseUserResourceReturn<T> {
  const { isAuthenticated, isConfigured, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  // Default true so a signed-in page shows a spinner on first paint rather
  // than flashing its empty state before the load resolves.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Lets a late response from a superseded request be dropped.
  const requestIdRef = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!isAuthenticated || !isConfigured) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (requestIdRef.current === requestId) setItems(response);
    } catch (err) {
      // Surface the failure so the caller renders an error rather than
      // claiming the user has nothing saved.
      if (requestIdRef.current === requestId) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, [fetcher, isAuthLoading, isAuthenticated, isConfigured]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    void load();
  }, [load]);

  return { error, isLoading, items, reload: load, setItems };
}
