import { formatWait } from "@repo/shared/components/LoganSearch/LoganSearchStatus/queueNote";
import type { TopLevelSpec } from "vega-lite";

// One search, as the backend's /galaxy/kmindex/queue/history reports it.
export interface QueueHistoryRow {
  cached: boolean;
  run_minutes: number | null;
  state: string;
  still_waiting: boolean;
  submitted: string;
  wait_minutes: number | null;
}

export interface QueueHistory {
  as_of: string;
  cache_hits: number;
  hours: number;
  rows: QueueHistoryRow[];
  run_p50_minutes: number | null;
  searches: number;
  truncated: boolean;
  wait_max_minutes: number | null;
  wait_p50_minutes: number | null;
  wait_p90_minutes: number | null;
}

// The windows the page offers; the backend serves up to 72 hours.
export const QUEUE_RANGES = [24, 72] as const;
export type QueueRange = (typeof QUEUE_RANGES)[number];
export const DEFAULT_QUEUE_RANGE: QueueRange = 24;

export interface TimeBucket {
  cacheHits: number;
  longestWait: number | null;
  medianWait: number | null;
  searches: number;
  // The bucket's start, ISO 8601.
  start: string;
}

/**
 * The window a ?hours= value asks for, falling back to the default for
 * anything the page doesn't offer.
 * @param value - The query value, if any.
 * @returns The window.
 */
export function parseQueueRange(value: string | null): QueueRange {
  const hours = Number(value);
  return QUEUE_RANGES.find((range) => range === hours) ?? DEFAULT_QUEUE_RANGE;
}

/**
 * How many hours each table row covers, so three days still fits on a screen.
 * @param range - The window.
 * @returns Hours per bucket.
 */
export function bucketHoursFor(range: QueueRange): number {
  return range > 24 ? 3 : 1;
}

/**
 * A table row's time span, e.g. "Nov 5, 9 AM" or "Nov 5, 9 AM – 12 PM".
 * @param start - The bucket's start, ISO 8601.
 * @param bucketHours - Hours the bucket covers.
 * @returns Text.
 */
export function bucketLabel(start: string, bucketHours: number): string {
  const from = new Date(start);
  const label = from.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    month: "short",
  });
  if (bucketHours === 1) return label;
  // Wall-clock hours, like timeBuckets, so a clock-change night still ends
  // the block where the next one starts.
  const to = new Date(from);
  to.setHours(from.getHours() + bucketHours);
  return `${label} – ${to.toLocaleTimeString(undefined, { hour: "numeric" })}`;
}

/**
 * The middle value, taking the lower one for an even count, as the backend does.
 * @param values - Non-empty list.
 * @returns The median.
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length / 2) - 1];
}

/**
 * Group searches by when they were submitted, in blocks of whole local hours
 * (3 h blocks start at midnight, 3 am, 6 am...).
 * @param rows - Searches, any order.
 * @param bucketHours - Hours per bucket.
 * @returns One bucket per block that had a search, newest first.
 */
export function timeBuckets(
  rows: QueueHistoryRow[],
  bucketHours = 1
): TimeBucket[] {
  const byStart = new Map<string, QueueHistoryRow[]>();
  for (const row of rows) {
    const date = new Date(row.submitted);
    if (Number.isNaN(date.getTime())) continue;
    date.setHours(date.getHours() - (date.getHours() % bucketHours), 0, 0, 0);
    const start = date.toISOString();
    byStart.set(start, [...(byStart.get(start) ?? []), row]);
  }
  return [...byStart.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([start, inBucket]) => {
      const waits = inBucket
        .filter((r) => !r.cached && r.wait_minutes !== null)
        .map((r) => r.wait_minutes as number);
      return {
        cacheHits: inBucket.filter((r) => r.cached).length,
        longestWait: waits.length ? Math.max(...waits) : null,
        medianWait: waits.length ? median(waits) : null,
        searches: inBucket.length,
        start,
      };
    });
}

/**
 * How a search's row should be labelled on the chart.
 * @param row - The search.
 * @returns Its group.
 */
export function rowGroup(row: QueueHistoryRow): string {
  if (row.cached) return "Answered from cache";
  if (row.still_waiting) return "Still waiting";
  if (row.state === "running") return "Running";
  if (row.state === "error") return "Failed";
  return "Finished";
}

/**
 * A search's wait for a tooltip.
 * @param row - The search.
 * @returns Text.
 */
function waitLabel(row: QueueHistoryRow): string {
  if (row.cached) return "no wait";
  if (row.wait_minutes === null) return "unknown";
  return formatWait(row.wait_minutes);
}

/**
 * Each search's wait to start, against when it was submitted.
 *
 * Cache hits sit at zero: they never waited, and leaving them off would hide
 * how much of the day they answered.
 * @param rows - Searches.
 * @param range - The window they cover; past a day the axis names the weekday.
 * @returns A vega-lite spec.
 */
export function buildWaitSpec(
  rows: QueueHistoryRow[],
  range: QueueRange = DEFAULT_QUEUE_RANGE
): TopLevelSpec {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    data: {
      values: rows.map((row) => ({
        group: rowGroup(row),
        submitted: row.submitted,
        wait: row.cached ? 0 : row.wait_minutes,
        waitLabel: waitLabel(row),
      })),
    },
    encoding: {
      color: {
        field: "group",
        legend: { orient: "bottom", title: null },
        scale: {
          domain: [
            "Finished",
            "Running",
            "Still waiting",
            "Answered from cache",
            "Failed",
          ],
          range: ["#5b3fd1", "#2a9fd6", "#e69b2b", "#9aa0a6", "#d33f49"],
        },
        type: "nominal",
      },
      tooltip: [
        {
          field: "submitted",
          format: "%b %d %H:%M",
          timeUnit: "yearmonthdatehoursminutes",
          title: "Submitted",
          type: "temporal",
        },
        { field: "waitLabel", title: "Waited", type: "nominal" },
        { field: "group", title: "Status", type: "nominal" },
      ],
      x: {
        axis: { format: range > 24 ? "%a %H:%M" : "%H:%M", title: null },
        field: "submitted",
        type: "temporal",
      },
      y: {
        axis: { title: "Minutes waiting to start" },
        field: "wait",
        type: "quantitative",
      },
    },
    height: 260,
    mark: { filled: true, opacity: 0.85, size: 60, type: "point" },
    width: "container",
  } as TopLevelSpec;
}
