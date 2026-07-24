import { useAssemblyFavorites } from "@/hooks/useAssemblyFavorites";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { FavoriteResponse } from "@repo/shared/services/api-client/types";
import { act, renderHook, waitFor } from "@testing-library/react";

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

describe("useAssemblyFavorites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
    } as unknown as ReturnType<typeof useAuth>);
    mockClient.getFavorites.mockResolvedValue([]);
  });

  test("flags isToggling while a toggle request is in flight", async () => {
    let resolveCreate: ((value: FavoriteResponse) => void) | undefined;
    mockClient.createFavorite.mockReturnValue(
      new Promise<FavoriteResponse>((resolve) => {
        resolveCreate = resolve;
      })
    );

    const { result } = renderHook(() => useAssemblyFavorites());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let togglePromise: Promise<void> | undefined;
    act(() => {
      togglePromise = result.current.toggleFavorite(ACCESSION);
    });

    expect(result.current.isToggling).toBe(true);

    await act(async () => {
      resolveCreate?.({ entity_id: ACCESSION } as FavoriteResponse);
      await togglePromise;
    });

    expect(result.current.isToggling).toBe(false);
  });

  test("clears isToggling and records error when a toggle fails", async () => {
    mockClient.createFavorite.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAssemblyFavorites());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.toggleFavorite(ACCESSION);
    });

    expect(result.current.isToggling).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
