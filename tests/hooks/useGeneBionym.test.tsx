import { useGeneBionym } from "@repo/shared/hooks/useGeneBionym";
import { fetchGeneBionym } from "@repo/shared/services/genes/api";
import { type BionymClaims } from "@repo/shared/services/genes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HTTPError } from "ky";
import { type JSX, type ReactNode } from "react";

// fetchGeneBionym tells "no graph" from "unavailable" with instanceof, so the
// stub carries an error class of its own; the API client is built with
// ky.create.
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

const UID = "f0adadd3-973b-5c61-9e11-7c688b4e0895";
const BIONYM: BionymClaims = {
  geneUid: UID,
  input: "PF3D7_1343700",
  runDate: "2026-11-02",
  sources: [],
};

/**
 * A ky response stub that resolves to the claims.
 * @returns An object shaped like ky's response promise.
 */
function found(): { json: () => Promise<unknown> } {
  return { json: () => Promise.resolve(BIONYM) };
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
 * Render useGeneBionym with a query client that doesn't retry.
 * @param geneUid - The gene UID to fetch.
 * @returns The hook's result.
 */
function renderUseGeneBionym(geneUid: string | undefined): {
  result: { current: ReturnType<typeof useGeneBionym> };
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useGeneBionym(geneUid), { wrapper });
}

beforeEach(() => mockGet.mockReset());

describe("fetchGeneBionym", () => {
  it("returns the claims", async () => {
    mockGet.mockReturnValue(found());
    await expect(fetchGeneBionym(UID)).resolves.toEqual(BIONYM);
    expect(mockGet).toHaveBeenCalledWith(
      `genes/${UID}/bionym`,
      expect.anything()
    );
  });

  it.each([404, 422])("treats %i as no graph", async (status) => {
    mockGet.mockReturnValue(fails(new MockHTTPError(status)));
    await expect(fetchGeneBionym(UID)).resolves.toBeNull();
  });

  it("throws on a 503", async () => {
    const error = new MockHTTPError(503);
    mockGet.mockReturnValue(fails(error));
    await expect(fetchGeneBionym(UID)).rejects.toBe(error);
  });
});

describe("useGeneBionym", () => {
  it("is null, without a request, until the UID is known", () => {
    const { result } = renderUseGeneBionym(undefined);
    expect(result.current).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns the claims", async () => {
    mockGet.mockReturnValue(found());
    const { result } = renderUseGeneBionym(UID);
    await waitFor(() => expect(result.current).toEqual(BIONYM));
  });

  it.each([
    ["the gene has no graph", 404],
    ["the API is unavailable", 503],
  ])("is null when %s", async (_, status) => {
    mockGet.mockReturnValue(fails(new MockHTTPError(status)));
    const { result } = renderUseGeneBionym(UID);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
