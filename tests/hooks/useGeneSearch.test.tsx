import { useGeneSearch } from "@repo/shared/hooks/useGeneSearch";
import { type GeneSearchResult } from "@repo/shared/services/genes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { type JSX, type ReactNode } from "react";

// The API client is built with ky.create; its get is this stub.
const mockGet = jest.fn();
jest.mock("ky", () => ({
  __esModule: true,
  default: {
    // Delegate at call time: create() runs while this module is still
    // initialising, so naming the jest.fn() directly would hit the TDZ.
    create: (): unknown => ({
      delete: jest.fn(),
      get: (...args: unknown[]): unknown => mockGet(...args),
      post: jest.fn(),
    }),
  },
}));

const RESULT = { locusTag: "PF3D7_1133400" } as GeneSearchResult;

/**
 * A ky response stub that resolves to a search response.
 * @param truncated - Whether more genes matched.
 * @returns An object shaped like ky's response promise.
 */
function found(truncated = false): { json: () => Promise<unknown> } {
  return {
    json: () =>
      Promise.resolve({
        query: "ama",
        results: [RESULT],
        snapshot: {},
        truncated,
      }),
  };
}

/**
 * Render useGeneSearch with a query client that doesn't retry.
 * @param query - The search.
 * @returns The hook's result.
 */
function renderUseGeneSearch(query: string): {
  current: ReturnType<typeof useGeneSearch>;
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useGeneSearch(query), { wrapper }).result;
}

beforeEach(() => mockGet.mockReset());

describe("useGeneSearch", () => {
  it("is idle, without a request, for no search", () => {
    expect(renderUseGeneSearch("").current).toEqual({ status: "idle" });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("asks for up to 50 genes, and returns them", async () => {
    mockGet.mockReturnValue(found(true));
    const result = renderUseGeneSearch("ama");
    await waitFor(() =>
      expect(result.current).toEqual({
        results: [RESULT],
        status: "found",
        truncated: true,
      })
    );
    expect(mockGet).toHaveBeenCalledWith(
      "genes/search",
      expect.objectContaining({ searchParams: { limit: 50, q: "ama" } })
    );
  });

  it.each([
    ["more than 10 words", Array(11).fill("ama").join(" ")],
    ["more than 200 characters", "a".repeat(201)],
  ])("is invalid, without a request, for %s", (_, query) => {
    expect(renderUseGeneSearch(query).current).toEqual({ status: "invalid" });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("is unavailable when the request fails, until a retry answers", async () => {
    mockGet.mockReturnValue({
      json: () => Promise.reject(new TypeError("Failed to fetch")),
    });
    const result = renderUseGeneSearch("ama");
    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    mockGet.mockReturnValue(found());
    act(() => {
      if (result.current.status === "unavailable") result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("found"));
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
