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

  test("does not let a response from before sign-out repopulate items", async () => {
    let resolveFetch: ((value: { id: string }[]) => void) | undefined;
    // Annotated for the same reason as above: a bare jest.fn() carries no
    // return type for the hook to infer its generic from.
    const fetcher: () => Promise<{ id: string }[]> = jest.fn().mockReturnValue(
      new Promise<{ id: string }[]>((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { rerender, result } = renderHook(() => useUserResource(fetcher));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    rerender();

    await waitFor(() => expect(result.current.items).toEqual([]));

    await act(async () => {
      resolveFetch?.([{ id: "a" }]);
      await Promise.resolve();
    });

    expect(result.current.items).toEqual([]);
  });

  test("keeps the newer result when an overlapping reload resolves out of order", async () => {
    let resolveFirst: ((value: { id: string }[]) => void) | undefined;
    let resolveSecond: ((value: { id: string }[]) => void) | undefined;
    // Annotated for the same reason as above: a bare jest.fn() carries no
    // return type for the hook to infer its generic from.
    const fetcher: () => Promise<{ id: string }[]> = jest
      .fn()
      .mockReturnValueOnce(
        new Promise<{ id: string }[]>((resolve) => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise<{ id: string }[]>((resolve) => {
          resolveSecond = resolve;
        })
      );

    const { result } = renderHook(() => useUserResource(fetcher));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    let reloadPromise: Promise<void> | undefined;
    act(() => {
      reloadPromise = result.current.reload();
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    // The older (first-issued) request resolves last -- its response must
    // not overwrite the result of the newer, still-pending request.
    await act(async () => {
      resolveSecond?.([{ id: "second" }]);
      await Promise.resolve();
    });
    expect(result.current.items).toEqual([{ id: "second" }]);

    await act(async () => {
      resolveFirst?.([{ id: "first" }]);
      await reloadPromise;
    });
    expect(result.current.items).toEqual([{ id: "second" }]);
  });

  test("does not fetch when signed in but not configured", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    const fetcher = jest.fn().mockResolvedValue([{ id: "a" }]);

    const { result } = renderHook(() => useUserResource(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
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
