import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { useKmindexSummary } from "@repo/shared/hooks/useKmindexSummary";
import { act, renderHook, waitFor } from "@testing-library/react";
import ky, { HTTPError } from "ky";

// Same stub shape as useKmindexSearch.test.ts: the hook tells a 409 apart by
// instanceof, so the error class has to be the module's own.
jest.mock("ky", () => {
  class StubHTTPError extends Error {
    response: { json: () => Promise<unknown>; status: number };
    constructor(status: number, detail: unknown) {
      super(`HTTP ${status}`);
      this.response = {
        json: (): Promise<unknown> => Promise.resolve({ detail }),
        status,
      };
    }
  }
  class StubTimeoutError extends Error {}
  return {
    HTTPError: StubHTTPError,
    TimeoutError: StubTimeoutError,
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
  };
});

const mockKy = ky as unknown as { get: jest.Mock; post: jest.Mock };
const MockHTTPError = HTTPError as unknown as new (
  status: number,
  detail: unknown
) => Error;

const JOB_ID = "dee9dc267ca2a401";
const FILTER = "f.country=Kenya&f.platform=ILLUMINA";

const RESULTS = {
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
  total_hits: 100,
  total_matches: 100,
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
 * The searchParams of every results request so far.
 * @returns What ky was given, oldest first.
 */
function resultsParams(): unknown[] {
  return mockKy.get.mock.calls
    .filter(([url]) => String(url).includes("/results"))
    .map(([, options]) => options?.searchParams);
}

/**
 * Reattach to a completed job with the given filter, and let the first page
 * land.
 * @param initial - Filter query the hook starts with.
 * @returns The rendered hook.
 */
async function reattached(
  initial: string
): Promise<
  ReturnType<
    typeof renderHook<ReturnType<typeof useKmindexSearch>, { query: string }>
  >
> {
  window.history.replaceState(null, "", `/logan-search?job=${JOB_ID}`);
  const rendered = renderHook(
    ({ query }: { query: string }) => useKmindexSearch(query),
    { initialProps: { query: initial } }
  );
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await waitFor(() => expect(rendered.result.current.results).not.toBeNull());
  return rendered;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
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
    return jsonOf(RESULTS);
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useKmindexSearch with filters", () => {
  it("sends exactly the old request when there is no filter", async () => {
    await reattached("");
    expect(resultsParams()).toEqual([
      { limit: 25, offset: 0, order: "desc", sort: "score" },
    ]);
  });

  it("sends the filter as repeated f.* params alongside paging and sort", async () => {
    await reattached(FILTER);
    expect(resultsParams()).toEqual([
      [
        ["limit", "25"],
        ["offset", "0"],
        ["order", "desc"],
        ["sort", "score"],
        ["f.country", "Kenya"],
        ["f.platform", "ILLUMINA"],
      ],
    ]);
  });

  it("re-asks from the first page when the filter changes", async () => {
    const { rerender, result } = await reattached("");
    await act(async () => {
      await result.current.goToPage(50);
    });

    await act(async () => {
      rerender({ query: FILTER });
    });

    const last = resultsParams().at(-1) as [string, string][];
    expect(last).toContainEqual(["offset", "0"]);
    expect(last).toContainEqual(["f.platform", "ILLUMINA"]);
  });

  it("does not re-ask when the filter is unchanged", async () => {
    const { rerender } = await reattached(FILTER);
    const before = resultsParams().length;
    await act(async () => {
      rerender({ query: FILTER });
    });
    expect(resultsParams()).toHaveLength(before);
  });

  it("reports a 409 as a filter problem and keeps the results", async () => {
    const { rerender, result } = await reattached("");
    mockKy.get.mockImplementation((url: string) => {
      if (url.includes("/results"))
        return Promise.reject(
          new MockHTTPError(409, {
            code: "filters_unavailable",
            reason: "Filtering needs the full match set on disk.",
          })
        );
      return jsonOf({});
    });

    await act(async () => {
      rerender({ query: FILTER });
    });

    await waitFor(() =>
      expect(result.current.filterError).toBe(
        "Filtering needs the full match set on disk."
      )
    );
    expect(result.current.error).toBeNull();
    expect(result.current.results?.job_id).toBe(JOB_ID);
  });
});

describe("useKmindexSummary", () => {
  it("asks nothing without a filter", () => {
    const { result } = renderHook(() => useKmindexSummary(JOB_ID, "", true));
    expect(mockKy.get).not.toHaveBeenCalled();
    expect(result.current.summary).toBeNull();
  });

  it("asks nothing before the results have landed", () => {
    renderHook(() => useKmindexSummary(JOB_ID, FILTER, false));
    expect(mockKy.get).not.toHaveBeenCalled();
  });

  it("fetches the summary for the filter", async () => {
    const summary = {
      cohort: { total: 3 },
      geography: {},
      matched: 3,
      total_matches: 100,
    };
    mockKy.get.mockReturnValue(jsonOf(summary));

    const { result } = renderHook(() =>
      useKmindexSummary(JOB_ID, FILTER, true)
    );

    await waitFor(() => expect(result.current.summary).toEqual(summary));
    const [url, options] = mockKy.get.mock.calls[0];
    expect(url).toContain(`/kmindex/jobs/${JOB_ID}/summary`);
    expect(String(options.searchParams)).toBe(FILTER);
  });

  it("passes on the reason a filter cannot be served", async () => {
    mockKy.get.mockReturnValue({
      json: (): Promise<unknown> =>
        Promise.reject(
          new MockHTTPError(409, {
            code: "filters_unavailable",
            reason: "No file.",
          })
        ),
    });

    const { result } = renderHook(() =>
      useKmindexSummary(JOB_ID, FILTER, true)
    );

    await waitFor(() => expect(result.current.error).toBe("No file."));
  });
});
