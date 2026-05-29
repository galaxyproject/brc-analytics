import { act, renderHook, waitFor } from "@testing-library/react";
import { useAssemblyFavorites } from "../../app/hooks/useAssemblyFavorites";
import { useAuth } from "../../app/providers/authentication";
import { brcAPIClient } from "../../app/services/brc-api-client";
import { FavoriteResponse } from "../../app/types/api";

jest.mock("../../app/providers/authentication", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../app/services/brc-api-client", () => ({
  brcAPIClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    getFavorites: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockClient = brcAPIClient as jest.Mocked<typeof brcAPIClient>;

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
