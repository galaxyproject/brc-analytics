import { createLoganTheme } from "@logan/theme/theme";
import {
  bucketHoursFor,
  buildWaitSpec,
  parseQueueRange,
  type QueueHistory,
  type QueueHistoryRow,
  rowGroup,
  timeBuckets,
} from "@logan/views/QueueStatsView/queueStats";
import { QueueStatsView } from "@logan/views/QueueStatsView/queueStatsView";
import { ThemeProvider } from "@mui/material";
import { useKmindexQueue } from "@repo/shared/hooks/useKmindexQueue";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ky from "ky";

jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock("@repo/shared/hooks/useKmindexQueue", () => ({
  useKmindexQueue: jest.fn(),
}));
// vega is ESM-only and draws nothing under jsdom anyway.
jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({ finalize: jest.fn() })),
}));

const mockRouter = {
  pathname: "/queue",
  replace: jest.fn(() => Promise.resolve(true)),
};
jest.mock("next/router", () => ({
  useRouter: (): typeof mockRouter => mockRouter,
}));

const mockKy = ky as unknown as { get: jest.Mock };

/**
 * A search row.
 * @param submitted - When it was submitted.
 * @param overrides - Fields to change.
 * @returns The row.
 */
function row(
  submitted: string,
  overrides: Partial<QueueHistoryRow> = {}
): QueueHistoryRow {
  return {
    cached: false,
    run_minutes: 1.5,
    state: "ok",
    still_waiting: false,
    submitted,
    wait_minutes: 2,
    ...overrides,
  };
}

const ROWS = [
  row("2026-10-15T07:11:00+00:00", { wait_minutes: 50.8 }),
  row("2026-10-15T07:38:00+00:00", { wait_minutes: 27.9 }),
  row("2026-10-15T07:52:00+00:00", { cached: true, wait_minutes: null }),
  row("2026-10-15T08:07:00+00:00", { wait_minutes: 1.6 }),
];

const HISTORY: QueueHistory = {
  as_of: "2026-10-15T14:54:29+00:00",
  cache_hits: 1,
  hours: 24,
  rows: ROWS,
  run_p50_minutes: 0.9,
  searches: 4,
  truncated: false,
  wait_max_minutes: 154.4,
  wait_p50_minutes: 0.7,
  wait_p90_minutes: 138.3,
};

describe("timeBuckets", () => {
  test("groups by submission hour, newest first, leaving cache hits out of the waits", () => {
    const buckets = timeBuckets(ROWS);

    expect(buckets.map((b) => b.start)).toEqual([
      "2026-10-15T08:00:00.000Z",
      "2026-10-15T07:00:00.000Z",
    ]);
    expect(buckets[1]).toEqual({
      cacheHits: 1,
      longestWait: 50.8,
      medianWait: 27.9,
      searches: 3,
      start: "2026-10-15T07:00:00.000Z",
    });
  });

  test("groups into blocks of whole local hours", () => {
    // Built from local times so the blocks don't depend on the test's zone.
    const local = (hour: number, minute: number): string =>
      new Date(2026, 10, 3, hour, minute).toISOString();
    const rows = [
      row(local(9, 5), { wait_minutes: 4 }),
      row(local(10, 40), { wait_minutes: 10 }),
      row(local(11, 59), { wait_minutes: 1 }),
      row(local(12, 0), { wait_minutes: 7 }),
      row(local(23, 30), { cached: true, wait_minutes: null }),
    ];

    const buckets = timeBuckets(rows, 3);

    expect(buckets.map((b) => b.start)).toEqual([
      new Date(2026, 10, 3, 21).toISOString(),
      new Date(2026, 10, 3, 12).toISOString(),
      new Date(2026, 10, 3, 9).toISOString(),
    ]);
    expect(buckets[2]).toMatchObject({
      cacheHits: 0,
      longestWait: 10,
      medianWait: 4,
      searches: 3,
    });
    expect(buckets[0]).toMatchObject({
      cacheHits: 1,
      longestWait: null,
      medianWait: null,
      searches: 1,
    });
  });
});

describe("ranges", () => {
  test("reads ?hours= and falls back to a day for anything not offered", () => {
    expect(parseQueueRange("72")).toBe(72);
    expect(parseQueueRange("24")).toBe(24);
    expect(parseQueueRange(null)).toBe(24);
    expect(parseQueueRange("48")).toBe(24);
    expect(parseQueueRange("lots")).toBe(24);
  });

  test("coarsens the table to 3 h blocks past a day", () => {
    expect(bucketHoursFor(24)).toBe(1);
    expect(bucketHoursFor(72)).toBe(3);
  });
});

describe("buildWaitSpec", () => {
  test("puts cache hits at zero rather than leaving them off", () => {
    const spec = buildWaitSpec(ROWS) as unknown as {
      data: { values: { group: string; wait: number | null }[] };
    };

    expect(spec.data.values[2]).toMatchObject({
      group: "Answered from cache",
      wait: 0,
    });
    expect(spec.data.values[0].wait).toBeCloseTo(50.8);
  });

  test("names the weekday on the axis past a day", () => {
    type XAxis = { encoding: { x: { axis: { format: string } } } };
    const day = buildWaitSpec(ROWS, 24) as unknown as XAxis;
    const three = buildWaitSpec(ROWS, 72) as unknown as XAxis;

    expect(day.encoding.x.axis.format).toBe("%H:%M");
    expect(three.encoding.x.axis.format).toBe("%a %H:%M");
  });

  test("names each kind of search", () => {
    expect(rowGroup(row("x", { state: "queued", still_waiting: true }))).toBe(
      "Still waiting"
    );
    expect(rowGroup(row("x", { state: "running" }))).toBe("Running");
    expect(rowGroup(row("x", { state: "error" }))).toBe("Failed");
  });
});

describe("QueueStatsView", () => {
  beforeEach(() => {
    (useKmindexQueue as jest.Mock).mockReturnValue({
      as_of: "2026-10-15T14:54:29+00:00",
      oldest_waiting_minutes: 84,
      recent_searches: 0,
      recent_wait_minutes: null,
      recent_wait_p90_minutes: null,
      running: 2,
      waiting: 5,
      window_minutes: 120,
    });
    mockKy.get.mockReset();
    mockKy.get.mockReturnValue({ json: () => Promise.resolve(HISTORY) });
    mockRouter.replace.mockClear();
    window.history.replaceState({}, "", "/queue");
  });

  /**
   * The page, themed.
   * @returns The render result.
   */
  function renderPage(): ReturnType<typeof render> {
    return render(
      <ThemeProvider theme={createLoganTheme()}>
        <QueueStatsView />
      </ThemeProvider>
    );
  }

  test("shows the queue now and the last day", async () => {
    renderPage();

    expect(screen.getByText("1 h 24 min")).toBeTruthy();
    expect(await screen.findByText("2 h 18 min")).toBeTruthy();
    expect(screen.getByText("2 h 34 min")).toBeTruthy();
    expect(screen.getByText("90th percentile wait")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(mockKy.get.mock.calls[0][0]).toContain(
      "/galaxy/kmindex/queue/history"
    );
    expect(mockKy.get.mock.calls[0][1].searchParams).toEqual({ hours: 24 });
  });

  test("opens on the window a shared link names", async () => {
    window.history.replaceState({}, "", "/queue?hours=72");
    mockKy.get.mockReturnValue({
      json: () => Promise.resolve({ ...HISTORY, hours: 72 }),
    });

    renderPage();

    expect(await screen.findByText("2 h 18 min")).toBeTruthy();
    expect(mockKy.get).toHaveBeenCalledTimes(1);
    expect(mockKy.get.mock.calls[0][1].searchParams).toEqual({ hours: 72 });
    expect(screen.getByText("Last 72 hours")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "72 hours", pressed: true })
    ).toBeTruthy();
    // 07:11-08:07 UTC falls in one or two 3 h blocks depending on the zone.
    expect(screen.getByRole("columnheader", { name: "Hours" })).toBeTruthy();
  });

  test("switching the window reloads it and records it in the URL", async () => {
    renderPage();
    expect(await screen.findByText("2 h 18 min")).toBeTruthy();

    const pending: { resolve?: (value: QueueHistory) => void } = {};
    mockKy.get.mockReturnValue({
      json: () =>
        new Promise<QueueHistory>((resolve) => {
          pending.resolve = resolve;
        }),
    });
    fireEvent.click(screen.getByRole("button", { name: "72 hours" }));

    // The day's figures don't linger under the new heading.
    expect(screen.getByText("Last 72 hours")).toBeTruthy();
    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(mockKy.get.mock.calls[1][1].searchParams).toEqual({ hours: 72 });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      { pathname: "/queue", query: { hours: 72 } },
      undefined,
      { shallow: true }
    );

    pending.resolve?.({ ...HISTORY, hours: 72 });
    await waitFor(() =>
      expect(screen.queryByText("Loading…")).not.toBeInTheDocument()
    );
    expect(screen.getByText("2 h 18 min")).toBeTruthy();
  });
});
