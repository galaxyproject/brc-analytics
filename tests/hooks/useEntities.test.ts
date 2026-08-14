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

  test("starts not loaded with no error", () => {
    const loader = jest.fn().mockReturnValue(new Promise<void>(() => {}));

    const { result } = renderHook(() => useEntities(loader));

    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoaded).toBe(false);
  });

  test("flips isLoaded when the loader resolves", async () => {
    const loader = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(loader).toHaveBeenCalledWith(CONFIG);
    expect(result.current.error).toBeUndefined();
  });

  test("captures a rejection as a DataExplorerError", async () => {
    const loader = jest.fn().mockRejectedValue(new Error("fetch failed"));

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(DataExplorerError)
    );
    expect(result.current.error?.message).toBe("fetch failed");
    expect(result.current.isLoaded).toBe(false);
  });

  test("captures a non-Error rejection reason", async () => {
    const loader = jest.fn().mockRejectedValue(undefined);

    const { result } = renderHook(() => useEntities(loader));

    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(DataExplorerError)
    );
    expect(result.current.error?.message).toBe("undefined");
    expect(result.current.isLoaded).toBe(false);
  });

  test("clears a previous error when a later load succeeds", async () => {
    const failingLoader = jest
      .fn()
      .mockRejectedValue(new Error("fetch failed"));
    const succeedingLoader = jest.fn().mockResolvedValue(undefined);

    const { rerender, result } = renderHook(
      ({ loader }) => useEntities(loader),
      { initialProps: { loader: failingLoader } }
    );
    await waitFor(() =>
      expect(result.current.error).toBeInstanceOf(DataExplorerError)
    );

    rerender({ loader: succeedingLoader });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.error).toBeUndefined();
  });

  test("does not load without a config", () => {
    mockGetConfig.mockReturnValue(undefined as unknown as SiteConfig);
    const loader = jest.fn().mockResolvedValue(undefined);

    renderHook(() => useEntities(loader));

    expect(loader).not.toHaveBeenCalled();
  });
});
