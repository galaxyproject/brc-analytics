import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { useEntities } from "@repo/shared/services/workflows/hooks/UseEntities/hook";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock("@databiosphere/findable-ui/lib/config/config", () => ({
  getConfig: jest.fn(),
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;

const CONFIG = {} as SiteConfig;

describe("useEntities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockReturnValue(CONFIG);
    // Silence the load-failure diagnostic logged for rejection tests.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("marks each started list as loading once the loader has run", () => {
    const loader = jest
      .fn()
      .mockReturnValue({ assemblies: new Promise<void>(() => {}) });

    const { result } = renderHook(() => useEntities(loader));

    expect(result.current.isStarted).toBe(true);
    expect(result.current.loadStates.assemblies).toEqual({ isLoaded: false });
  });

  test("records each list's outcome as it settles, without waiting on the others", async () => {
    const loader = jest.fn().mockReturnValue({
      assemblies: Promise.resolve(),
      workflows: new Promise<void>(() => {}),
    });

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.isLoaded).toBe(true)
    );
    expect(result.current.loadStates.workflows).toEqual({ isLoaded: false });
  });

  test("captures a loader that throws while starting, starting no lists", () => {
    const loader = jest.fn().mockImplementation(() => {
      throw new Error("bad config");
    });

    const { result } = renderHook(() => useEntities(loader));

    expect(result.current.isStarted).toBe(true);
    expect(result.current.loadStates).toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      "Failed to start loading entities:",
      expect.any(DataExplorerError)
    );
  });

  test("flips isLoaded when the list's load resolves", async () => {
    const loader = jest.fn().mockReturnValue({ assemblies: Promise.resolve() });

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.isLoaded).toBe(true)
    );
    expect(loader).toHaveBeenCalledWith(CONFIG);
    expect(result.current.loadStates.assemblies?.error).toBeUndefined();
  });

  test("captures a rejection as a DataExplorerError", async () => {
    const loader = jest.fn().mockReturnValue({
      assemblies: Promise.reject(new Error("fetch failed")),
    });

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.error).toBeInstanceOf(
        DataExplorerError
      )
    );
    expect(result.current.loadStates.assemblies?.error?.message).toBe(
      "fetch failed"
    );
    expect(result.current.loadStates.assemblies?.isLoaded).toBe(false);
  });

  test("captures a non-Error rejection reason", async () => {
    const loader = jest
      .fn()
      .mockReturnValue({ assemblies: Promise.reject(undefined) });

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.error).toBeInstanceOf(
        DataExplorerError
      )
    );
    expect(result.current.loadStates.assemblies?.error?.message).toBe(
      "undefined"
    );
    expect(result.current.loadStates.assemblies?.isLoaded).toBe(false);
  });

  test("clears a previous error when a later load succeeds", async () => {
    const failingLoader = jest.fn().mockReturnValue({
      assemblies: Promise.reject(new Error("fetch failed")),
    });
    const succeedingLoader = jest
      .fn()
      .mockReturnValue({ assemblies: Promise.resolve() });

    const { rerender, result } = renderHook(
      ({ loader }) => useEntities(loader),
      { initialProps: { loader: failingLoader } }
    );
    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.error).toBeInstanceOf(
        DataExplorerError
      )
    );

    rerender({ loader: succeedingLoader });

    await waitFor(() =>
      expect(result.current.loadStates.assemblies?.isLoaded).toBe(true)
    );
    expect(result.current.loadStates.assemblies?.error).toBeUndefined();
  });

  test("does not load without a config", () => {
    mockGetConfig.mockReturnValue(undefined as unknown as SiteConfig);
    const loader = jest.fn().mockReturnValue({});

    const { result } = renderHook(() => useEntities(loader));

    expect(loader).not.toHaveBeenCalled();
    expect(result.current.isStarted).toBe(false);
  });
});
