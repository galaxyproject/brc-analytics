import { createLoganTheme } from "@logan/theme/theme";
import {
  buildWaitSpec,
  hourlyBuckets,
  type QueueHistory,
  type QueueHistoryRow,
  rowGroup,
} from "@logan/views/QueueStatsView/queueStats";
import { QueueStatsView } from "@logan/views/QueueStatsView/queueStatsView";
import { ThemeProvider } from "@mui/material";
import { useKmindexQueue } from "@repo/shared/hooks/useKmindexQueue";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
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

describe("hourlyBuckets", () => {
  test("groups by submission hour, newest first, leaving cache hits out of the waits", () => {
    const buckets = hourlyBuckets(ROWS);

    expect(buckets.map((b) => b.hour)).toEqual([
      "2026-10-15T08:00:00.000Z",
      "2026-10-15T07:00:00.000Z",
    ]);
    expect(buckets[1]).toEqual({
      cacheHits: 1,
      hour: "2026-10-15T07:00:00.000Z",
      longestWait: 50.8,
      medianWait: 27.9,
      searches: 3,
    });
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
    expect(spec.data.values[0].wait).toBe(50.8);
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
    mockKy.get.mockReturnValue({ json: () => Promise.resolve(HISTORY) });
  });

  test("shows the queue now and the last day", async () => {
    render(
      <ThemeProvider theme={createLoganTheme()}>
        <QueueStatsView />
      </ThemeProvider>
    );

    expect(screen.getByText("1 h 24 min")).toBeTruthy();
    expect(await screen.findByText("2 h 18 min")).toBeTruthy();
    expect(screen.getByText("2 h 34 min")).toBeTruthy();
    expect(screen.getByText("90th percentile wait")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(mockKy.get.mock.calls[0][0]).toContain(
      "/galaxy/kmindex/queue/history"
    );
  });
});
