import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("useUserResource", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
  });

  test("loads items for an authenticated user", async () => {
    const fetcher = jest.fn().mockResolvedValue([{ id: "a" }]);

    const { result } = renderHook(() => useUserResource(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual([{ id: "a" }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("does not fetch when signed out and reports an empty list", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    const fetcher = jest.fn().mockResolvedValue([{ id: "a" }]);

    const { result } = renderHook(() => useUserResource(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  test("surfaces a fetch failure instead of an empty list", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUserResource(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe("boom");
  });

  test("reload refetches", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce([{ id: "a" }])
      .mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);

    const { result } = renderHook(() => useUserResource(fetcher));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.items).toHaveLength(2);
  });

  test("setItems updates locally without refetching", async () => {
    // Annotated so TS can infer the hook's generic from a bare jest.fn(),
    // whose call signature otherwise carries no return type.
    const fetcher: () => Promise<{ id: string }[]> = jest
      .fn()
      .mockResolvedValue([{ id: "a" }, { id: "b" }]);

    const { result } = renderHook(() => useUserResource(fetcher));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setItems((current) =>
        current.filter((item) => item.id !== "a")
      );
    });

    expect(result.current.items).toEqual([{ id: "b" }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("stays loading while auth is still resolving", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);
    const fetcher = jest.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useUserResource(fetcher));

    expect(result.current.isLoading).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
