import {
  createContext,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Optional base URL for the BFF auth endpoints. Empty = same-origin (the
// deployed case, where nginx routes /api/v1/* to the backend). Set it only for
// cross-origin local dev (frontend :3000 -> backend :8000). It is NOT a gate --
// loginEnabled alone controls whether the login UI shows.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface BrcUser {
  email: string;
  name: string;
  preferred_username: string;
  sub: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  user: BrcUser | null;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isConfigured: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  user: null,
});

/**
 * Provides authentication state via the BFF auth endpoints.
 * @param props - Component props.
 * @param props.children - Child components.
 * @param props.loginEnabled - Whether login UI should be shown.
 * @returns auth context provider wrapping children.
 */
export function BrcAuthProvider({
  children,
  loginEnabled = false,
}: {
  children: ReactNode;
  loginEnabled?: boolean;
}): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<BrcUser | null>(null);

  useEffect(() => {
    if (!loginEnabled) {
      setIsLoading(false);
      return;
    }
    fetch(`${BACKEND_URL}/api/v1/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && !data.error) {
          setUser(data as BrcUser);
        }
      })
      .catch(() => {
        // Not authenticated or backend unavailable — both fine.
      })
      .finally(() => setIsLoading(false));
  }, [loginEnabled]);

  const login = useCallback(() => {
    window.location.href = `${BACKEND_URL}/api/v1/auth/login`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        credentials: "include",
        method: "POST",
      });
    } catch {
      // Best-effort logout.
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isConfigured: loginEnabled,
        isLoading,
        login,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns the current authentication context.
 * @returns auth context value.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
