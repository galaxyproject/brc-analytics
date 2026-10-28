import { useGene } from "@repo/shared/hooks/useGene";
import { fetchGene } from "@repo/shared/services/genes/api";
import { type Gene } from "@repo/shared/services/genes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HTTPError } from "ky";
import { type JSX, type ReactNode } from "react";

// fetchGene tells "not found" from "unavailable" with instanceof, so the stub
// carries an error class of its own; the API client is built with ky.create.
const mockGet = jest.fn();
jest.mock("ky", () => {
  class StubHTTPError extends Error {
    response: { status: number };
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.response = { status };
    }
  }
  return {
    HTTPError: StubHTTPError,
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
  };
});

const MockHTTPError = HTTPError as unknown as new (status: number) => Error;

const UID = "d9049485-ed74-5455-98c2-5dc13eef544a";
const GENE = { geneUid: UID, locusTag: "PF3D7_1133400" } as Gene;

/**
 * A ky response stub that resolves to a gene response.
 * @returns An object shaped like ky's response promise.
 */
function found(): { json: () => Promise<unknown> } {
  return { json: () => Promise.resolve({ gene: GENE, snapshot: {} }) };
}

/**
 * A ky response stub that rejects.
 * @param error - What the request rejects with.
 * @returns An object shaped like ky's response promise.
 */
function fails(error: Error): { json: () => Promise<never> } {
  return { json: () => Promise.reject(error) };
}

/**
 * Render useGene with a query client that doesn't retry.
 * @param geneUid - The gene UID to fetch.
 * @returns The hook's result and its query client.
 */
function renderUseGene(geneUid: string | undefined): {
  queryClient: QueryClient;
  result: { current: ReturnType<typeof useGene> };
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useGene(geneUid), { wrapper });
  return { queryClient, result };
}

beforeEach(() => mockGet.mockReset());

describe("fetchGene", () => {
  it("returns the gene", async () => {
    mockGet.mockReturnValue(found());
    await expect(fetchGene(UID)).resolves.toEqual({
      gene: GENE,
      status: "found",
    });
    expect(mockGet).toHaveBeenCalledWith(`genes/${UID}`, expect.anything());
  });

  it.each([404, 422])("treats %i as not found", async (status) => {
    mockGet.mockReturnValue(fails(new MockHTTPError(status)));
    await expect(fetchGene(UID)).resolves.toEqual({ status: "not_found" });
  });

  it.each([
    ["a 503", new MockHTTPError(503)],
    ["a network error", new TypeError("Failed to fetch")],
  ])("throws on %s", async (_, error) => {
    mockGet.mockReturnValue(fails(error));
    await expect(fetchGene(UID)).rejects.toBe(error);
  });
});

describe("useGene", () => {
  it("is loading, without a request, until the UID is known", () => {
    const { result } = renderUseGene(undefined);
    expect(result.current).toEqual({ status: "loading" });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("is unavailable when the first load fails", async () => {
    mockGet.mockReturnValue(fails(new MockHTTPError(503)));
    const { result } = renderUseGene(UID);
    await waitFor(() =>
      expect(result.current).toEqual({ status: "unavailable" })
    );
  });

  it("keeps a loaded gene when a refetch fails", async () => {
    mockGet.mockReturnValue(found());
    const { queryClient, result } = renderUseGene(UID);
    await waitFor(() => expect(result.current.status).toBe("found"));
    mockGet.mockReturnValue(fails(new MockHTTPError(502)));
    await queryClient.refetchQueries({ queryKey: ["gene", UID] });
    // The failed refetch is an error the query records, not a new result.
    await waitFor(() =>
      expect(queryClient.getQueryState(["gene", UID])?.status).toBe("error")
    );
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ gene: GENE, status: "found" });
  });
});
