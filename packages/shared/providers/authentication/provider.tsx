import {
  createContext,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../../config/api";

interface AuthUser {
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
  user: AuthUser | null;
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
export function AuthProvider({
  children,
  loginEnabled = false,
}: {
  children: ReactNode;
  loginEnabled?: boolean;
}): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!loginEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && !data.error) {
          setUser(data as AuthUser);
        }
      })
      .catch(() => {
        // Not authenticated or backend unavailable — both fine.
      })
      .finally(() => setIsLoading(false));
  }, [loginEnabled]);

  const login = useCallback(() => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
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
