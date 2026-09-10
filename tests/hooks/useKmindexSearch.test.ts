import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { act, renderHook, waitFor } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockKy = ky as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

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
        // The endpoint echoes the sort it applied; echoing the request back is
        // the mirror-available path, where what was asked for is what ran.
        const params = options?.searchParams ?? {};
        return jsonOf({
          ...RESULTS,
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
});
