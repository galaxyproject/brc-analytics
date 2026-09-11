import {
  appliedSort,
  useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { act, renderHook, waitFor } from "@testing-library/react";
import ky, { HTTPError, TimeoutError } from "ky";

// The hook tells "still merging" from "this job is broken" with instanceof, so
// the stub has to carry error classes of its own rather than plain Errors.
jest.mock("ky", () => {
  class StubHTTPError extends Error {
    response: { json: () => Promise<unknown>; status: number };
    constructor(status: number, detail: string) {
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

const mockKy = ky as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

// ky's real constructors take a Response; the stubs above take the two things
// a test actually cares about.
const MockHTTPError = HTTPError as unknown as new (
  status: number,
  detail: string
) => Error;
const MockTimeoutError = TimeoutError as unknown as new () => Error;

const JOB_ID = "dee9dc267ca2a401";

/**
 * Render the hook and let the on-mount index fetch settle inside act().
 * @returns The rendered hook result.
 */
async function renderSettled(): Promise<
  ReturnType<typeof renderHook<ReturnType<typeof useKmindexSearch>, unknown>>
> {
  const rendered = renderHook(() => useKmindexSearch());
  await act(async () => {
    await Promise.resolve();
  });
  return rendered;
}

/**
 * A ky-like thenable whose .json() resolves to `value`.
 * @param value - Payload the stubbed request should resolve to.
 * @returns An object exposing a json() promise, as ky does.
 */
function jsonOf(value: unknown): { json: () => Promise<unknown> } {
  return { json: (): Promise<unknown> => Promise.resolve(value) };
}

/**
 * A promise with its settle handles exposed, so a test can hold one request
 * open while a later one runs to completion.
 * @returns The pending promise alongside its resolve and reject.
 */
function deferred(): {
  promise: Promise<unknown>;
  reject: (reason: unknown) => void;
  resolve: (value: unknown) => void;
} {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const INDEXES = { count: 2, indexes: ["GENOMIC_BCT", "METAGENOMIC_ENV"] };

const RESULTS = {
  hits: [],
  job_id: JOB_ID,
  limit: 25,
  offset: 0,
  per_index: [{ hits_after_cap: 0, hits_before_cap: 0, index: "GENOMIC_BCT" }],
  query_name: "q",
  shards_failed: 0,
  shards_searched: 55,
  shards_with_hits: 33,
  sra_annotated: 0,
  sra_mirror_available: true,
  total_hits: 0,
  total_matches: 0,
  truncated: false,
};

const COMPLETE_STATUS = {
  is_complete: true,
  is_successful: true,
  job_id: JOB_ID,
  state: "ok",
};

function setUrl(search: string): void {
  window.history.replaceState(null, "", `/logan-search${search}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  setUrl("");
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/kmindex/indexes")) return jsonOf(INDEXES);
    if (url.includes("/status")) return jsonOf(COMPLETE_STATUS);
    return jsonOf(RESULTS);
  });
  mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("job id in the URL", () => {
  it("reattaches to a job named in ?job= and loads its results", async () => {
    setUrl(`?job=${JOB_ID}`);

    const { result } = await renderSettled();

    expect(result.current.jobId).toBe(JOB_ID);

    // The reattach starts polling; one tick reaches the completed job.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(result.current.results).not.toBeNull());
    expect(result.current.results?.job_id).toBe(JOB_ID);
  });

  it("does not reattach when no job is named", async () => {
    const { result } = await renderSettled();
    expect(result.current.jobId).toBeNull();
    expect(mockKy.get.mock.calls[0][1]).toMatchObject({
      credentials: "include",
    });
  });

  it("records the job id on submit so a reload can pick it up", async () => {
    const { result } = await renderSettled();

    await act(async () => {
      await result.current.submit({
        indexes: ["GENOMIC_BCT", "METAGENOMIC_ENV"],
        sequence: ">q\nACGT",
        threshold: 0.3,
        zvalue: 6,
      });
    });

    expect(new URLSearchParams(window.location.search).get("job")).toBe(JOB_ID);
  });

  it("clears the job id on reset", async () => {
    setUrl(`?job=${JOB_ID}`);
    const { result } = await renderSettled();

    act(() => {
      result.current.reset();
    });

    expect(new URLSearchParams(window.location.search).get("job")).toBeNull();
    expect(result.current.jobId).toBeNull();
  });
});

describe("session cookie", () => {
  it("sends the session cookie with submissions", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));
    const { result } = await renderSettled();
    await act(async () => {
      await result.current.submit({
        indexes: ["GENOMIC_BCT"],
        sequence: ">q\nACGT",
        threshold: 0.3,
        zvalue: 6,
      });
    });
    expect(mockKy.post.mock.calls[0][1]).toMatchObject({
      credentials: "include",
    });
  });
});

describe("which account the search ran under", () => {
  /**
   * Submit once against whatever mockKy.post is currently returning.
   * @returns The rendered hook result.
   */
  async function submitOnce(): Promise<
    ReturnType<typeof renderHook<ReturnType<typeof useKmindexSearch>, unknown>>
  > {
    const rendered = await renderSettled();
    await act(async () => {
      await rendered.result.current.submit({
        indexes: ["GENOMIC_BCT"],
        sequence: ">q\nACGT",
        threshold: 0.3,
        zvalue: 6,
      });
    });
    return rendered;
  }

  it("captures a service-account fallback from the submit response", async () => {
    mockKy.post.mockReturnValue(
      jsonOf({ identity: "service", job_id: JOB_ID })
    );
    const { result } = await submitOnce();
    expect(result.current.identity).toBe("service");
  });

  it("captures a user-account submission", async () => {
    mockKy.post.mockReturnValue(jsonOf({ identity: "user", job_id: JOB_ID }));
    const { result } = await submitOnce();
    expect(result.current.identity).toBe("user");
  });

  it("is null when the response says nothing about identity", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));
    const { result } = await submitOnce();
    expect(result.current.identity).toBeNull();
  });

  it("clears the identity on reset", async () => {
    mockKy.post.mockReturnValue(
      jsonOf({ identity: "service", job_id: JOB_ID })
    );
    const { result } = await submitOnce();

    act(() => {
      result.current.reset();
    });

    expect(result.current.identity).toBeNull();
  });
});

describe("the sort a response says it applied", () => {
  it("reads score order out of a response predating the field", () => {
    expect(appliedSort(RESULTS)).toEqual({ column: "score", order: "desc" });
  });

  it("reads back the pair a response carries", () => {
    expect(
      appliedSort({
        ...RESULTS,
        order: "asc" as const,
        sort: "country" as const,
      })
    ).toEqual({ column: "country", order: "asc" });
  });
});

describe("sort and page size", () => {
  /**
   * The searchParams of the most recent results request.
   * @returns The object ky was given, or undefined when nothing was fetched.
   */
  function lastResultsParams(): Record<string, unknown> | undefined {
    const calls = mockKy.get.mock.calls.filter(([url]) =>
      String(url).includes("/results")
    );
    return calls.at(-1)?.[1]?.searchParams;
  }

  /**
   * Reattach to a completed job, so the hook has a job id to page and sort.
   * @returns The rendered hook result, with its first page already loaded.
   */
  async function reattached(): Promise<
    ReturnType<typeof renderHook<ReturnType<typeof useKmindexSearch>, unknown>>
  > {
    setUrl(`?job=${JOB_ID}`);
    mockKy.get.mockImplementation(
      (url: string, options?: { searchParams?: Record<string, unknown> }) => {
        if (url.includes("/kmindex/indexes")) return jsonOf(INDEXES);
        if (url.includes("/status")) return jsonOf(COMPLETE_STATUS);
        // The endpoint echoes the size it served and the sort it applied;
        // echoing the request back is the mirror-available path, where what
        // was asked for is what ran.
        const params = options?.searchParams ?? {};
        return jsonOf({
          ...RESULTS,
          limit: params.limit ?? RESULTS.limit,
          order: params.order ?? "desc",
          sort: params.sort ?? "score",
        });
      }
    );
    const rendered = await renderSettled();
    // The reattach starts polling; one tick reaches the completed job and
    // pulls the first page.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(rendered.result.current.results).not.toBeNull());
    return rendered;
  }

  it("asks for the default page in score order", async () => {
    await reattached();
    expect(lastResultsParams()).toMatchObject({
      limit: 25,
      offset: 0,
      order: "desc",
      sort: "score",
    });
  });

  it("sorting by a text column starts ascending and goes back to page one", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.goToPage(50);
    });
    await act(async () => {
      await result.current.setSort("organism");
    });
    expect(lastResultsParams()).toMatchObject({
      offset: 0,
      order: "asc",
      sort: "organism",
    });
  });

  it("sorting the same column again flips the direction", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.setSort("organism");
    });
    await act(async () => {
      await result.current.setSort("organism");
    });
    expect(lastResultsParams()).toMatchObject({
      order: "desc",
      sort: "organism",
    });
  });

  it("asks again for ascending when the server fell back to score order", async () => {
    const { result } = await reattached();
    // The mirror cannot answer a metadata sort, so every page comes back in
    // score order however it was asked for, and score stays the lit header.
    mockKy.get.mockImplementation((url: string) => {
      if (url.includes("/kmindex/indexes")) return jsonOf(INDEXES);
      if (url.includes("/status")) return jsonOf(COMPLETE_STATUS);
      return jsonOf({
        ...RESULTS,
        order: "desc",
        sort: "score",
        sra_mirror_available: false,
      });
    });

    await act(async () => {
      await result.current.setSort("organism");
    });
    await act(async () => {
      await result.current.setSort("organism");
    });

    expect(lastResultsParams()).toMatchObject({
      order: "asc",
      sort: "organism",
    });
  });

  it("paging after a mirror fallback stays in the order on screen", async () => {
    const { result } = await reattached();
    // Score order comes back however the sort was asked for, and that is what
    // the reader is looking at, so page two has to ask for the same thing
    // rather than re-request the sort the mirror already refused.
    mockKy.get.mockImplementation((url: string) => {
      if (url.includes("/kmindex/indexes")) return jsonOf(INDEXES);
      if (url.includes("/status")) return jsonOf(COMPLETE_STATUS);
      return jsonOf({
        ...RESULTS,
        order: "desc",
        sort: "score",
        sra_mirror_available: false,
      });
    });

    await act(async () => {
      await result.current.setSort("organism");
    });
    await act(async () => {
      await result.current.goToPage(25);
    });

    expect(lastResultsParams()).toMatchObject({ order: "desc", sort: "score" });
  });

  it("the flip seeds from score order when the response carries no sort", async () => {
    // The default stub answers with RESULTS, which predates the sort fields:
    // the page on screen is in score order and says nothing about it, so a
    // click on the score header flips it rather than asking for desc again.
    setUrl(`?job=${JOB_ID}`);
    const { result } = await renderSettled();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(result.current.results).not.toBeNull());

    await act(async () => {
      await result.current.setSort("score");
    });

    expect(lastResultsParams()).toMatchObject({ order: "asc", sort: "score" });
  });

  it("sorting by score starts descending", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.setSort("organism");
    });
    await act(async () => {
      await result.current.setSort("score");
    });
    expect(lastResultsParams()).toMatchObject({ order: "desc", sort: "score" });
  });

  it("changing the page size refetches from the first page at that size", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.goToPage(25);
    });
    await act(async () => {
      await result.current.setPageSize(100);
    });
    expect(lastResultsParams()).toMatchObject({ limit: 100, offset: 0 });
  });

  it("a failed page-size change leaves the next page at the size on screen", async () => {
    const { result } = await reattached();
    // The refetch at the new size never lands, so the rows on screen are
    // still the 25 the last successful response carried.
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => Promise.reject(new Error("boom")),
    }));
    await act(async () => {
      await result.current.setPageSize(100);
    });
    await act(async () => {
      await result.current.goToPage(25);
    });

    expect(lastResultsParams()).toMatchObject({ limit: 25, offset: 25 });
    expect(result.current.pageSize).toBe(25);
  });

  it("a failed sort change leaves the next page in the order on screen", async () => {
    const { result } = await reattached();
    // Same for the order: the header still lights the score column the last
    // successful response echoed.
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => Promise.reject(new Error("boom")),
    }));
    await act(async () => {
      await result.current.setSort("organism");
    });
    await act(async () => {
      await result.current.goToPage(25);
    });

    expect(lastResultsParams()).toMatchObject({ order: "desc", sort: "score" });
    expect(result.current.sort).toEqual({ column: "score", order: "desc" });
  });

  it("a stale page-size failure does not undo a later change", async () => {
    const { result } = await reattached();
    // Nothing disables the size selector while a request is in flight and a
    // cold fetch runs for minutes, so two changes can be outstanding at once.
    // Hold the first one open.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.setPageSize(100);
      await Promise.resolve();
    });

    // The second change answers while the first is still waiting.
    mockKy.get.mockImplementationOnce(() => jsonOf({ ...RESULTS, limit: 50 }));
    await act(async () => {
      await result.current.setPageSize(50);
    });

    await act(async () => {
      pending.reject(new Error("boom"));
      await stale;
    });
    await act(async () => {
      await result.current.goToPage(50);
    });

    expect(result.current.pageSize).toBe(50);
    expect(lastResultsParams()).toMatchObject({ limit: 50, offset: 50 });
  });

  it("a stale sort failure does not undo a later change", async () => {
    const { result } = await reattached();
    // Same race on the headers: the country sort answers while the organism
    // one is still out.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.setSort("organism");
      await Promise.resolve();
    });

    // The stub echoes the request, so this one comes back sorted by country
    // ascending, which is what the header then lights.
    await act(async () => {
      await result.current.setSort("country");
    });

    await act(async () => {
      pending.reject(new Error("boom"));
      await stale;
    });
    await act(async () => {
      await result.current.goToPage(50);
    });

    expect(result.current.sort).toEqual({ column: "country", order: "asc" });
    expect(lastResultsParams()).toMatchObject({
      order: "asc",
      sort: "country",
    });
  });

  it("a failed size change does not undo a sort that landed at the new size", async () => {
    const { result } = await reattached();
    // Every request carries the size and the sort together, so the sort that
    // answers second lands at the size the first one asked for. Hold the size
    // change open while that happens.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.setPageSize(100);
      await Promise.resolve();
    });

    mockKy.get.mockImplementationOnce(() =>
      jsonOf({
        ...RESULTS,
        limit: 100,
        offset: 0,
        order: "asc",
        sort: "organism",
      })
    );
    await act(async () => {
      await result.current.setSort("organism");
    });
    expect(lastResultsParams()).toMatchObject({ limit: 100, sort: "organism" });

    await act(async () => {
      pending.reject(new Error("boom"));
      await stale;
    });
    await act(async () => {
      await result.current.goToPage(100);
    });

    expect(result.current.pageSize).toBe(100);
    expect(result.current.sort).toEqual({ column: "organism", order: "asc" });
    expect(lastResultsParams()).toMatchObject({
      limit: 100,
      offset: 100,
      order: "asc",
      sort: "organism",
    });
  });

  it("a stale success does not overwrite a newer page", async () => {
    const { result } = await reattached();
    // Two size changes out at once again, but this time the slow one comes
    // back too: landing it would put a page the reader has already moved off
    // back on screen.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.setPageSize(100);
      await Promise.resolve();
    });

    mockKy.get.mockImplementationOnce(() => jsonOf({ ...RESULTS, limit: 50 }));
    await act(async () => {
      await result.current.setPageSize(50);
    });

    await act(async () => {
      pending.resolve({ ...RESULTS, limit: 100 });
      await stale;
    });

    expect(result.current.results?.limit).toBe(50);
    expect(result.current.pageSize).toBe(50);

    await act(async () => {
      await result.current.goToPage(50);
    });
    expect(lastResultsParams()).toMatchObject({ limit: 50, offset: 50 });
  });

  it("a page fetch that fails while a size change is out wins, and the size change is dropped", async () => {
    const { result } = await reattached();
    // Paging moves no ref of its own, so its failure has nothing to roll back
    // -- but it is the newest thing the reader asked for, and they are owed
    // the banner and the page they are still on, not the pending size.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.setPageSize(100);
      await Promise.resolve();
    });

    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => Promise.reject(new Error("boom")),
    }));
    await act(async () => {
      await result.current.goToPage(25);
    });

    await act(async () => {
      pending.resolve({ ...RESULTS, limit: 100 });
      await stale;
    });

    expect(result.current.results?.limit).toBe(25);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.error).toBe("boom");

    await act(async () => {
      await result.current.goToPage(25);
    });
    expect(lastResultsParams()).toMatchObject({ limit: 25, offset: 25 });
  });

  it("paging keeps the current sort and size", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.setPageSize(50);
    });
    await act(async () => {
      await result.current.setSort("country");
    });
    await act(async () => {
      await result.current.goToPage(100);
    });
    expect(lastResultsParams()).toMatchObject({
      limit: 50,
      offset: 100,
      order: "asc",
      sort: "country",
    });
  });

  it("a new search goes back to score order but keeps the page size", async () => {
    const { result } = await reattached();
    await act(async () => {
      await result.current.setPageSize(100);
    });
    await act(async () => {
      await result.current.setSort("organism");
    });

    await act(async () => {
      await result.current.submit({
        indexes: ["GENOMIC_BCT"],
        sequence: ">q\nACGT",
        threshold: 0.3,
        zvalue: 6,
      });
    });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() =>
      expect(lastResultsParams()).toMatchObject({
        limit: 100,
        offset: 0,
        order: "desc",
        sort: "score",
      })
    );
    expect(result.current.sort).toEqual({ column: "score", order: "desc" });
    expect(result.current.pageSize).toBe(100);
  });

  it("a request still out when the search is reset does not land", async () => {
    const { result } = await reattached();
    // Clearing the search while a page fetch is out must not put the old job's
    // rows back on what is now an empty screen.
    const pending = deferred();
    mockKy.get.mockImplementationOnce(() => ({
      json: (): Promise<unknown> => pending.promise,
    }));
    let stale!: Promise<void>;
    await act(async () => {
      stale = result.current.goToPage(25);
      await Promise.resolve();
    });

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      pending.resolve({ ...RESULTS, offset: 25 });
      await stale;
    });

    expect(result.current.results).toBeNull();
  });
});

describe("a merge that outlives the request", () => {
  // What the backend answers while another request is still merging the job's
  // shards. ky does not throw on a 202, so the hook sees a Response.
  const STILL_MERGING = {
    json: (): Promise<unknown> =>
      Promise.resolve({ detail: `Results for job ${JOB_ID} are being merged` }),
    status: 202,
  };

  /**
   * Results requests made so far.
   * @returns How many times the results endpoint was asked.
   */
  function resultsCalls(): number {
    return mockKy.get.mock.calls.filter(([url]) =>
      String(url).includes("/results")
    ).length;
  }

  /**
   * Reattach to a completed job, answering each results request in turn.
   * @param answers - One per results request; the last one repeats.
   * @returns The rendered hook result, with the first request already out.
   */
  async function reattachedWith(
    answers: (() => unknown)[]
  ): Promise<
    ReturnType<typeof renderHook<ReturnType<typeof useKmindexSearch>, unknown>>
  > {
    setUrl(`?job=${JOB_ID}`);
    let asked = 0;
    mockKy.get.mockImplementation((url: string) => {
      if (url.includes("/kmindex/indexes")) return jsonOf(INDEXES);
      if (url.includes("/status")) return jsonOf(COMPLETE_STATUS);
      const answer = answers[Math.min(asked, answers.length - 1)];
      asked += 1;
      return answer();
    });
    const rendered = await renderSettled();
    // The reattach starts polling; one tick reaches the completed job and
    // makes the first results request.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    return rendered;
  }

  it("asks again after a 202 and lands the results", async () => {
    const { result } = await reattachedWith([
      (): unknown => STILL_MERGING,
      (): unknown => jsonOf(RESULTS),
    ]);

    // Still merging is neither a failure nor an empty result: the spinner
    // stays up and the table stays away.
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(true);

    // Halfway through the wait, nothing has changed.
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });
    expect(resultsCalls()).toBe(1);
    expect(result.current.isLoadingResults).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(8000);
    });

    await waitFor(() => expect(result.current.results).not.toBeNull());
    expect(resultsCalls()).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(false);
  });

  it("asks again after the request times out", async () => {
    // The merge ran past the request's own 300 s, which is what a search over
    // many indexes does routinely.
    const { result } = await reattachedWith([
      (): unknown => {
        throw new MockTimeoutError();
      },
      (): unknown => jsonOf(RESULTS),
    ]);

    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => expect(result.current.results).not.toBeNull());
    expect(resultsCalls()).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(false);
  });

  it("asks again after the proxy gives up with a 504", async () => {
    // nginx stopped waiting on the backend; the backend did not stop merging.
    const { result } = await reattachedWith([
      (): unknown => {
        throw new MockHTTPError(504, "Gateway Time-out");
      },
      (): unknown => jsonOf(RESULTS),
    ]);

    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => expect(result.current.results).not.toBeNull());
    expect(resultsCalls()).toBe(2);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoadingResults).toBe(false);
  });

  it("gives up once the job has been merging for an hour", async () => {
    const { result } = await reattachedWith([(): unknown => STILL_MERGING]);
    // The first 202 stamped the clock; the next arrives past the budget,
    // which is as long as the backend keeps a partial result anyway.
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValue(Date.now() + 60 * 60 * 1000 + 1);

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
    nowSpy.mockRestore();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe(
      "Results are still being merged after an hour. Reload later to try again."
    );
    expect(result.current.isLoadingResults).toBe(false);

    // And it stops asking.
    const asked = resultsCalls();
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    expect(resultsCalls()).toBe(asked);
  });

  it("a pending re-ask does not fire for a search the page has left", async () => {
    const { result } = await reattachedWith([
      (): unknown => STILL_MERGING,
      (): unknown => jsonOf(RESULTS),
    ]);
    const asked = resultsCalls();

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(resultsCalls()).toBe(asked);
    expect(result.current.results).toBeNull();
    expect(result.current.isLoadingResults).toBe(false);
  });

  it("a server error still raises the banner straight away", async () => {
    const { result } = await reattachedWith([
      (): unknown => {
        throw new MockHTTPError(500, "Failed to get kmindex results: boom");
      },
    ]);

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("Failed to get kmindex results: boom");
    expect(result.current.isLoadingResults).toBe(false);
    expect(resultsCalls()).toBe(1);
  });
});
