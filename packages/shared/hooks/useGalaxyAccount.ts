import { API_BASE_URL } from "@repo/shared/config/api";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import ky from "ky";
import { useCallback, useEffect, useState } from "react";

export interface GalaxyAccountState {
  error: string | null;
  galaxyLoginUrl: string | null;
  galaxyUsername: string | null;
  isLinked: boolean | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

interface GalaxyAccountResponse {
  galaxy_login_url: string | null;
  galaxy_user_id: string | null;
  galaxy_username: string | null;
  identity: "none" | "service" | "user";
  linked: boolean;
}

/**
 * Whether the signed-in user's Galaxy identity is linked, so kmindex jobs can
 * run as them. isLinked is null when signed out (searches use the shared
 * service account) or while unknown.
 * @returns Link state and a refresh action for after the user completes linking.
 */
export const useGalaxyAccount = (): GalaxyAccountState => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<Omit<GalaxyAccountState, "refresh">>({
    error: null,
    galaxyLoginUrl: null,
    galaxyUsername: null,
    isLinked: null,
    isLoading: true,
  });

  const refresh = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setState({
        error: null,
        galaxyLoginUrl: null,
        galaxyUsername: null,
        isLinked: null,
        isLoading: false,
      });
      return;
    }
    try {
      const res = await ky
        .get(`${API_BASE_URL}/galaxy/user`, {
          credentials: "include",
          timeout: 30000,
        })
        .json<GalaxyAccountResponse>();
      setState({
        error: null,
        galaxyLoginUrl: res.galaxy_login_url,
        galaxyUsername: res.galaxy_username,
        isLinked: res.identity === "user" ? res.linked : null,
        isLoading: false,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Could not check your Galaxy account link.",
        isLoading: false,
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    refresh();
  }, [refresh]);

  return { ...state, refresh };
};
