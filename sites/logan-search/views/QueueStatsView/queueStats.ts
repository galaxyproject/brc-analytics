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

export interface HourBucket {
  cacheHits: number;
  // The hour's start, ISO 8601.
  hour: string;
  longestWait: number | null;
  medianWait: number | null;
  searches: number;
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
 * Group searches by the hour they were submitted in.
 * @param rows - Searches, any order.
 * @returns One bucket per hour that had a search, newest first.
 */
export function hourlyBuckets(rows: QueueHistoryRow[]): HourBucket[] {
  const byHour = new Map<string, QueueHistoryRow[]>();
  for (const row of rows) {
    const date = new Date(row.submitted);
    if (Number.isNaN(date.getTime())) continue;
    date.setMinutes(0, 0, 0);
    const hour = date.toISOString();
    byHour.set(hour, [...(byHour.get(hour) ?? []), row]);
  }
  return [...byHour.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([hour, inHour]) => {
      const waits = inHour
        .filter((r) => !r.cached && r.wait_minutes !== null)
        .map((r) => r.wait_minutes as number);
      return {
        cacheHits: inHour.filter((r) => r.cached).length,
        hour,
        longestWait: waits.length ? Math.max(...waits) : null,
        medianWait: waits.length ? median(waits) : null,
        searches: inHour.length,
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
 * @returns A vega-lite spec.
 */
export function buildWaitSpec(rows: QueueHistoryRow[]): TopLevelSpec {
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
        axis: { format: "%H:%M", title: null },
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
