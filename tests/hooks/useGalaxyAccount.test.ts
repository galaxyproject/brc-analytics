import { useGalaxyAccount } from "@repo/shared/hooks/useGalaxyAccount";
import { act, renderHook } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

let authState: { isAuthenticated: boolean } = { isAuthenticated: true };

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: (): { isAuthenticated: boolean } => authState,
}));

const mockKy = ky as unknown as { get: jest.Mock };

/**
 * Render the hook and let its on-mount refresh settle inside act().
 * @returns The rendered hook result.
 */
async function renderSettled(): Promise<
  ReturnType<typeof renderHook<ReturnType<typeof useGalaxyAccount>, unknown>>
> {
  const rendered = renderHook(() => useGalaxyAccount());
  await act(async () => {
    await Promise.resolve();
  });
  return rendered;
}

beforeEach(() => {
  jest.clearAllMocks();
  authState = { isAuthenticated: true };
});

describe("useGalaxyAccount", () => {
  it("reports an unlinked account with its login url", async () => {
    mockKy.get.mockReturnValue({
      json: (): Promise<unknown> =>
        Promise.resolve({
          galaxy_login_url: "https://g/authnz/keycloak/login?redirect=true",
          galaxy_user_id: null,
          galaxy_username: null,
          identity: "user",
          linked: false,
        }),
    });
    const { result } = await renderSettled();
    expect(result.current.isLinked).toBe(false);
    expect(result.current.galaxyLoginUrl).toContain("redirect=true");
    expect(mockKy.get.mock.calls[0][1]).toMatchObject({
      credentials: "include",
    });
  });

  it("does not call the API when signed out", async () => {
    authState = { isAuthenticated: false };
    const { result } = await renderSettled();
    expect(mockKy.get).not.toHaveBeenCalled();
    expect(result.current.isLinked).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports isLinked null for non-user identity", async () => {
    mockKy.get.mockReturnValue({
      json: (): Promise<unknown> =>
        Promise.resolve({
          galaxy_login_url: null,
          galaxy_user_id: null,
          galaxy_username: null,
          identity: "service",
          linked: false,
        }),
    });
    const { result } = await renderSettled();
    expect(result.current.isLinked).toBeNull();
  });

  it("surfaces an error and allows retry", async () => {
    mockKy.get.mockReturnValue({
      json: (): Promise<unknown> => Promise.reject(new Error("boom")),
    });
    const { result } = await renderSettled();
    expect(result.current.error).toBe(
      "Could not check your Galaxy account link."
    );
    expect(result.current.isLoading).toBe(false);

    mockKy.get.mockReturnValue({
      json: (): Promise<unknown> =>
        Promise.resolve({
          galaxy_login_url: null,
          galaxy_user_id: "u1",
          galaxy_username: "alice",
          identity: "user",
          linked: true,
        }),
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLinked).toBe(true);
  });
});
