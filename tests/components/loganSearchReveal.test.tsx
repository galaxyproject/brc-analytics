import { LoganSearch } from "@repo/shared/components/LoganSearch/loganSearch";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ky from "ky";

// The form is taller than a screen, so Search has to bring the job card into
// view or nothing on screen says it did anything.
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

const RESULTS = {
  export_status: "available",
  hits: [],
  job_id: JOB_ID,
  limit: 25,
  offset: 0,
  per_index: [],
  query_name: "q",
  shards_failed: 0,
  shards_searched: 1,
  shards_with_hits: 0,
  sra_annotated: 0,
  sra_mirror_available: true,
  total_hits: 0,
  total_matches: 0,
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
 * Paste a query and press Search once the index list has loaded.
 */
async function search(): Promise<void> {
  render(<LoganSearch routes={{ searchPath: "/logan-search" }} />);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: ">q\nACGTACGTACGTACGTACGTACGTACGTACGTACGT" },
  });
  const button = screen.getByRole("button", { name: "Search Logan" });
  await waitFor(() => expect(button).toHaveProperty("disabled", false));
  await act(async () => {
    fireEvent.click(button);
  });
  await act(async () => {
    jest.advanceTimersByTime(50);
  });
}

/**
 * Let the job finish and its results land.
 */
async function finish(): Promise<void> {
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/status"))
      return jsonOf({
        is_complete: true,
        is_successful: true,
        job_id: JOB_ID,
        state: "ok",
      });
    if (url.includes("/results")) return jsonOf(RESULTS);
    return jsonOf({});
  });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await waitFor(() => expect(screen.queryByText(`Job ${JOB_ID}`)).toBe(null));
}

/**
 * The elements scrolled into view so far.
 * @returns One per call.
 */
function scrolledTo(): Element[] {
  return scrollIntoView.mock.instances as unknown as Element[];
}

const scrollIntoView = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/logan-search");
  Element.prototype.scrollIntoView = scrollIntoView;
  mockKy.get.mockImplementation((url: string) => {
    if (url.includes("/kmindex/indexes"))
      return jsonOf({ count: 1, indexes: ["GENOMIC_BCT"] });
    if (url.includes("/status"))
      return jsonOf({ is_complete: false, job_id: JOB_ID, state: "queued" });
    return jsonOf({});
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("LoganSearch after Search is pressed", () => {
  it("scrolls the job card into view", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));

    await search();

    expect(screen.getByText(`Job ${JOB_ID}`)).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrolledTo()[0].contains(screen.getByText(`Job ${JOB_ID}`))).toBe(
      true
    );
  });

  it("scrolls a failed submit's error into view", async () => {
    mockKy.post.mockReturnValue({
      json: (): Promise<never> => Promise.reject(new Error("refused")),
    });

    await search();

    const alert = await screen.findByRole("alert");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrolledTo()[0].contains(alert)).toBe(true);
  });

  it("brings the results up when they land under a watched card", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));
    await search();

    await finish();

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("leaves the page alone if the reader has scrolled off the card", async () => {
    mockKy.post.mockReturnValue(jsonOf({ job_id: JOB_ID }));
    await search();
    jest
      .spyOn(scrolledTo()[0], "getBoundingClientRect")
      .mockReturnValue({ top: -400 } as DOMRect);

    await finish();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
