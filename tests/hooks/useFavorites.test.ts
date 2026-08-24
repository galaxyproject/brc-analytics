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

    expect(result.current.togglingKey).toBe(`assembly:${ACCESSION}`);
    expect(result.current.isToggling).toBe(true);

    await act(async () => {
      resolveCreate?.({
        entity_id: ACCESSION,
        entity_type: "assembly",
      } as FavoriteResponse);
      await togglePromise;
    });

    expect(result.current.togglingKey).toBeNull();
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
