import {
  AuthProvider,
  useAuth,
} from "@repo/shared/providers/authentication/provider";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { JSX, ReactNode } from "react";

const USER = {
  email: "user@example.org",
  name: "User",
  preferred_username: "user",
  sub: "user-1",
};

/**
 * Wraps a hook in a provider with login turned on.
 * @param props - Component props.
 * @param props.children - The hook under test.
 * @returns The provider around the hook.
 */
function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <AuthProvider loginEnabled>{children}</AuthProvider>;
}

describe("AuthProvider logout", () => {
  let logoutRequest: { resolve: () => void };

  beforeEach(() => {
    global.fetch = jest.fn((url: RequestInfo | URL) => {
      if (String(url).endsWith("/auth/me")) {
        return Promise.resolve({
          json: () => Promise.resolve(USER),
          ok: true,
        } as Response);
      }
      return new Promise<Response>((resolve) => {
        logoutRequest = {
          resolve: (): void => resolve({ ok: true } as Response),
        };
      });
    }) as jest.Mock;
  });

  test("signs out on the page before the server has ended the session", async () => {
    // Anything reading the account while the logout request is in flight would
    // otherwise send one more request against a session being ended.
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let loggingOut!: Promise<void>;
    act(() => {
      loggingOut = result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    await act(async () => {
      logoutRequest.resolve();
      await loggingOut;
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
});
