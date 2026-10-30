import { LoganSearch } from "@repo/shared/components/LoganSearch/loganSearch";
import { act, render, screen, waitFor } from "@testing-library/react";
import ky from "ky";

// The whole page, with only the network stubbed, to pin down what the
// logan-filters flag changes and, with it off, that nothing does.
jest.mock("ky", () => {
  class StubHTTPError extends Error {}
  class StubTimeoutError extends Error {}
  return {
    HTTPError: StubHTTPError,
    TimeoutError: StubTimeoutError,
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
  };
});

jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({
    finalize: jest.fn(),
    view: { addEventListener: jest.fn() },
  })),
}));

const mockKy = ky as unknown as { get: jest.Mock; post: jest.Mock };

const JOB_ID = "dee9dc267ca2a401";

const COHORT = {
  bioprojects: 1,
  countries: 1,
  facets: [
    {
      name: "platform",
      other: 0,
      unknown: 0,
      values: [{ count: 10, value: "ILLUMINA" }],
    },
  ],
  in_mirror: 10,
  organisms: 1,
  studies: 1,
  top_organisms: [{ count: 10, value: "E. coli" }],
  total: 10,
};

const RESULTS = {
  cohort: COHORT,
  export_status: "available",
  hits: [],
  job_id: JOB_ID,
  limit: 25,
  offset: 0,
  per_index: [],
  query_name: "q",
  shards_failed: 0,
  shards_searched: 1,
  shards_with_hits: 1,
  sra_annotated: 0,
  sra_mirror_available: true,
  total_hits: 10,
  total_matches: 10,
  truncated: false,
};

/**
 * A ky-like thenable whose .json() resolves to `value`.
 * @param value - Payload.
 * @returns An object exposing json().
 */
function jsonOf(value: unknown): { json: () => Promise<unknown> } {
  return { json: (): Promise<unknown> => Promise.resolve(value) };
}

/**
 * Every URL requested so far.
 * @returns The URLs, oldest first.
 */
function requestedUrls(): string[] {
  return mockKy.get.mock.calls.map(([url]) => String(url));
}

/**
 * Open the page on a completed job whose link carries a filter, and let the
 * first page of results land.
 */
async function openFilteredLink(): Promise<void> {
  window.history.replaceState(
    null,
    "",
    `/logan-search?job=${JOB_ID}&f.platform=ILLUMINA`
  );
  render(<LoganSearch routes={{ searchPath: "/logan-search" }} />);
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await waitFor(() =>
    expect(requestedUrls().some((url) => url.includes("/results"))).toBe(true)
  );
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  window.localStorage.clear();
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/kmindex/indexes"))
      return jsonOf({ count: 1, indexes: ["GENOMIC_BCT"] });
    if (url.includes("/status"))
      return jsonOf({
        is_complete: true,
        is_successful: true,
        job_id: JOB_ID,
        state: "ok",
      });
    if (url.includes("/results")) return jsonOf(RESULTS);
    if (url.includes("/summary"))
      return jsonOf({
        cohort: COHORT,
        geography: null,
        matched: 10,
        total_matches: 10,
      });
    return jsonOf({});
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("LoganSearch and the logan-filters flag", () => {
  it("with the flag off, ignores a filtered link and asks for nothing new", async () => {
    await openFilteredLink();

    const results = mockKy.get.mock.calls.find(([url]) =>
      String(url).includes("/results")
    );
    expect(results?.[1].searchParams).toEqual({
      limit: 25,
      offset: 0,
      order: "desc",
      sort: "score",
    });
    expect(requestedUrls().some((url) => url.includes("/summary"))).toBe(false);
    expect(screen.queryByText(/Filter by clicking/)).toBe(null);
    expect(screen.queryByRole("button", { name: /^ILLUMINA/ })).toBe(null);
    // The link is left as it arrived rather than rewritten.
    expect(window.location.search).toContain("f.platform=ILLUMINA");
  });

  it("with the flag on, applies the link's filter to the table and breakdown", async () => {
    window.localStorage.setItem("logan-filters", "true");

    await openFilteredLink();

    const results = mockKy.get.mock.calls.find(([url]) =>
      String(url).includes("/results")
    );
    expect(results?.[1].searchParams).toContainEqual([
      "f.platform",
      "ILLUMINA",
    ]);
    await waitFor(() =>
      expect(requestedUrls().some((url) => url.includes("/summary"))).toBe(true)
    );
    expect(await screen.findByText("Platform: ILLUMINA")).toBeTruthy();
  });
});
