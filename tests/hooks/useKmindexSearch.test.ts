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

const INDEXES = { count: 2, indexes: ["GENOMIC_BCT", "METAGENOMIC_ENV"] };

const RESULTS = {
  hits: [],
  job_id: JOB_ID,
  limit: 25,
  offset: 0,
  query_name: "q",
  shards_failed: 0,
  shards_searched: 55,
  shards_with_hits: 33,
  sra_annotated: 0,
  sra_mirror_available: true,
  total_hits: 0,
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
