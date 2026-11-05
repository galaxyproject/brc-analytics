import { createLoganTheme } from "@logan/theme/theme";
import {
  bucketHoursFor,
  bucketLabel,
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
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ky from "ky";
import { renderToString } from "react-dom/server.node";
import embed from "vega-embed";

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
const mockEmbed = embed as unknown as jest.Mock;

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
    // Local times, as below: a half-hour zone would split ROWS differently.
    const local = (hour: number, minute = 0): string =>
      new Date(2026, 9, 15, hour, minute).toISOString();
    const buckets = timeBuckets([
      row(local(7, 11), { wait_minutes: 50.8 }),
      row(local(7, 38), { wait_minutes: 27.9 }),
      row(local(7, 52), { cached: true, wait_minutes: null }),
      row(local(8, 7), { wait_minutes: 1.6 }),
    ]);

    expect(buckets.map((b) => b.start)).toEqual([local(8), local(7)]);
    expect(buckets[1]).toEqual({
      cacheHits: 1,
      longestWait: 50.8,
      medianWait: 27.9,
      searches: 3,
      start: local(7),
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

describe("bucketLabel", () => {
  test("names the hour, or the block's start and end past one hour", () => {
    const nine = new Date(2026, 10, 3, 9).toISOString();
    // Some ICU versions put a narrow no-break space before AM/PM.
    const label = (hours: number): string =>
      bucketLabel(nine, hours).replace(/\s/g, " ");

    expect(label(1)).toBe("Nov 3, 9 AM");
    expect(label(3)).toBe("Nov 3, 9 AM – 12 PM");
  });

  test("ends a block on the wall-clock hour across a clock change", () => {
    // Only bites in a zone that changes clocks on these nights (any US zone);
    // run with TZ=America/New_York to see it.
    const label = (start: Date): string =>
      bucketLabel(start.toISOString(), 3).replace(/\s/g, " ");

    expect(label(new Date(2026, 2, 8, 0))).toBe("Mar 8, 12 AM – 3 AM");
    expect(label(new Date(2026, 10, 1, 0))).toBe("Nov 1, 12 AM – 3 AM");
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
    mockEmbed.mockClear();
    mockKy.get.mockReturnValue({ json: () => Promise.resolve(HISTORY) });
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

  test("the static page doesn't name a window before the URL is read", () => {
    window.history.replaceState({}, "", "/queue?hours=72");

    // No effects run on the server, as on the exported HTML.
    const markup = renderToString(
      <ThemeProvider theme={createLoganTheme()}>
        <QueueStatsView />
      </ThemeProvider>
    );
    const html = markup.replaceAll("<!-- -->", "");

    expect(html).not.toContain("Last 24 hours");
    expect(html).not.toContain("the last 24 hours");
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
    await waitFor(() => expect(mockEmbed).toHaveBeenCalled());
    const spec = mockEmbed.mock.calls[0][1];
    expect(spec.encoding.x.axis.format).toBe("%a %H:%M");
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
    expect(window.location.search).toBe("?hours=72");

    pending.resolve?.({ ...HISTORY, hours: 72 });
    await waitFor(() =>
      expect(screen.queryByText("Loading…")).not.toBeInTheDocument()
    );
    expect(screen.getByText("2 h 18 min")).toBeTruthy();
  });

  test("a failed first read of the new window shows the error, not the old window's figures", async () => {
    renderPage();
    expect(await screen.findByText("2 h 18 min")).toBeTruthy();

    mockKy.get.mockReturnValue({
      json: () => Promise.reject(new Error("down")),
    });
    fireEvent.click(screen.getByRole("button", { name: "72 hours" }));

    expect(
      await screen.findByText(/The history could not be loaded/)
    ).toBeTruthy();
    expect(screen.queryByText("2 h 18 min")).not.toBeInTheDocument();
  });

  test("a failed refresh keeps the figures already shown", async () => {
    jest.useFakeTimers();
    try {
      renderPage();
      expect(await screen.findByText("2 h 18 min")).toBeTruthy();

      mockKy.get.mockReturnValue({
        json: () => Promise.reject(new Error("down")),
      });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(5 * 60_000);
      });

      expect(mockKy.get).toHaveBeenCalledTimes(2);
      expect(screen.getByText("2 h 18 min")).toBeTruthy();
      expect(
        screen.queryByText(/The history could not be loaded/)
      ).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  test("switching the window keeps the link's other parameters", async () => {
    window.history.replaceState({}, "", "/queue?utm_source=mail&hours=24");
    renderPage();
    expect(await screen.findByText("2 h 18 min")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "72 hours" }));

    const params = new URLSearchParams(window.location.search);
    expect(params.get("hours")).toBe("72");
    expect(params.get("utm_source")).toBe("mail");
  });
});
