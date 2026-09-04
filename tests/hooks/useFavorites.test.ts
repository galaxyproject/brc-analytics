import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import {
  FavoritesProvider,
  useFavorites,
} from "@repo/shared/providers/favorites/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { FavoriteResponse } from "@repo/shared/services/api-client/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type JSX, type ReactNode } from "react";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    getFavorites: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockClient = apiClient as jest.Mocked<typeof apiClient>;

const ACCESSION = "GCF_000001405.40";
const TAXONOMY_ID = "5833";

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return createElement(FavoritesProvider, null, children);
}

describe("useFavorites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
    } as unknown as ReturnType<typeof useAuth>);
    mockClient.getFavorites.mockResolvedValue([]);
  });

  test("fetches once, unfiltered, no matter how many consumers mount", async () => {
    const { result } = renderHook(
      () => ({
        a: useFavorites(),
        b: useFavorites(),
        c: useFavorites(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.a.isLoading).toBe(false));

    expect(mockClient.getFavorites).toHaveBeenCalledTimes(1);
    // Unfiltered: the workspace needs both types from one call.
    expect(mockClient.getFavorites).toHaveBeenCalledWith();
  });

  test("keeps the two entity types apart even on a colliding id", async () => {
    mockClient.getFavorites.mockResolvedValue([
      { entity_id: "5833", entity_type: "organism" } as FavoriteResponse,
    ]);

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isFavorited(ENTITY_TYPE.ORGANISM, "5833")).toBe(true);
    expect(result.current.isFavorited(ENTITY_TYPE.ASSEMBLY, "5833")).toBe(
      false
    );
  });

  test("passes the entity type through when creating", async () => {
    mockClient.createFavorite.mockResolvedValue({
      entity_id: TAXONOMY_ID,
      entity_type: "organism",
    } as FavoriteResponse);

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(ENTITY_TYPE.ORGANISM, TAXONOMY_ID);
    });

    expect(mockClient.createFavorite).toHaveBeenCalledWith(
      TAXONOMY_ID,
      "organism"
    );
  });

  test("passes the entity type through when deleting", async () => {
    mockClient.getFavorites.mockResolvedValue([
      { entity_id: ACCESSION, entity_type: "assembly" } as FavoriteResponse,
    ]);
    mockClient.deleteFavorite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION);
    });

    expect(mockClient.deleteFavorite).toHaveBeenCalledWith(
      ACCESSION,
      "assembly"
    );
    expect(result.current.isFavorited(ENTITY_TYPE.ASSEMBLY, ACCESSION)).toBe(
      false
    );
  });

  test("a toggle in one consumer is visible to every other consumer", async () => {
    mockClient.createFavorite.mockResolvedValue({
      entity_id: ACCESSION,
      entity_type: "assembly",
    } as FavoriteResponse);

    const { result } = renderHook(
      () => ({ a: useFavorites(), b: useFavorites() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.a.isLoading).toBe(false));

    await act(async () => {
      await result.current.a.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION);
    });

    expect(result.current.b.isFavorited(ENTITY_TYPE.ASSEMBLY, ACCESSION)).toBe(
      true
    );
  });

  test("reports which key is toggling so only that row spins", async () => {
    let resolveCreate: ((value: FavoriteResponse) => void) | undefined;
    mockClient.createFavorite.mockReturnValue(
      new Promise<FavoriteResponse>((resolve) => {
        resolveCreate = resolve;
      })
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let togglePromise: Promise<void> | undefined;
    act(() => {
      togglePromise = result.current.toggleFavorite(
        ENTITY_TYPE.ASSEMBLY,
        ACCESSION
      );
    });

    expect(result.current.togglingKeys.has(`assembly:${ACCESSION}`)).toBe(true);
    expect(result.current.isToggling).toBe(true);

    await act(async () => {
      resolveCreate?.({
        entity_id: ACCESSION,
        entity_type: "assembly",
      } as FavoriteResponse);
      await togglePromise;
    });

    expect(result.current.togglingKeys.size).toBe(0);
  });

  test("a row stays disabled while another row is toggled", async () => {
    // Only the row being toggled is disabled, so if the pending set held one
    // key, starting a second toggle would re-enable the first mid-flight --
    // and a click there fires a second create off the same stale snapshot,
    // listing the favorite twice.
    // Left unresolved: both toggles have to still be in flight at the assert.
    const inFlight: Promise<void>[] = [];
    mockClient.createFavorite.mockImplementation(
      () => new Promise<FavoriteResponse>(() => undefined)
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      inFlight.push(
        result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION)
      );
    });
    act(() => {
      inFlight.push(
        result.current.toggleFavorite(ENTITY_TYPE.ORGANISM, "5833")
      );
    });

    expect(inFlight).toHaveLength(2);
    expect(result.current.togglingKeys.has(`assembly:${ACCESSION}`)).toBe(true);
    expect(result.current.togglingKeys.has("organism:5833")).toBe(true);
  });

  test("a repeat toggle of an in-flight entity is dropped, not duplicated", async () => {
    mockClient.createFavorite.mockImplementation(
      () => new Promise<FavoriteResponse>(() => undefined)
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const calls: Promise<void>[] = [];
    act(() => {
      calls.push(
        result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION)
      );
      calls.push(
        result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION)
      );
    });

    expect(calls).toHaveLength(2);
    expect(mockClient.createFavorite).toHaveBeenCalledTimes(1);
  });

  test("clears the toggling key and records error when a toggle fails", async () => {
    mockClient.createFavorite.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION);
    });

    expect(result.current.isToggling).toBe(false);
    expect(result.current.error?.message).toBe("network down");
  });

  test("a failed load is not mistaken for an empty one", async () => {
    // The list stays empty either way, so nothing but this flag separates
    // "you have saved nothing" from "we could not find out."
    mockClient.getFavorites.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasLoaded).toBe(false);
    expect(result.current.error?.message).toBe("network down");
  });

  test("a toggle against an unloaded set is refused, not guessed at", async () => {
    // keysRef is empty because the load failed, so the star would read as
    // "not favorited" and create one the user already has. The API is
    // idempotent and returns that existing row, which this provider would
    // then hold as the entire list -- every other favorite gone from the
    // account page until a reload.
    mockClient.getFavorites.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION);
    });

    expect(mockClient.createFavorite).not.toHaveBeenCalled();
    // And the load failure is still the error being reported, not cleared by
    // the refused toggle.
    expect(result.current.error?.message).toBe("network down");
    expect(result.current.favorites).toEqual([]);
  });

  test("waits for auth rather than reading unresolved as signed out", async () => {
    // isAuthenticated is false while /auth/me is in flight without meaning it.
    // Calling the set known-empty there leaves one committed render, after
    // auth resolves but before this provider refetches, where every control
    // is enabled and unfilled -- and a click in that frame creates a favorite
    // the user already has.
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(mockClient.getFavorites).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasLoaded).toBe(false);

    await act(async () => {
      await result.current.toggleFavorite(ENTITY_TYPE.ASSEMBLY, ACCESSION);
    });

    expect(mockClient.createFavorite).not.toHaveBeenCalled();
  });

  test("loads once auth resolves as signed in", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);

    const { rerender, result } = renderHook(() => useFavorites(), { wrapper });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    rerender();

    await waitFor(() => expect(result.current.hasLoaded).toBe(true));
    expect(mockClient.getFavorites).toHaveBeenCalledTimes(1);
  });

  test("does not fetch when the user is signed out", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
    } as unknown as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockClient.getFavorites).not.toHaveBeenCalled();
    expect(result.current.favorites).toEqual([]);
  });
});
