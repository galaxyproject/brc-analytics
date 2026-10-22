import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import {
  ResultsSection,
  SearchContainer,
} from "@logan/views/LoganSearchSiteView/loganSearchSiteView.styles";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { formatWait } from "@repo/shared/components/LoganSearch/LoganSearchStatus/queueNote";
import { API_BASE_URL } from "@repo/shared/config/api";
import { useKmindexQueue } from "@repo/shared/hooks/useKmindexQueue";
import ky from "ky";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
import { buildWaitSpec, hourlyBuckets, type QueueHistory } from "./queueStats";
import { ChartBox, StatGrid } from "./queueStatsView.styles";

// The backend keeps the history for five minutes; asking more often would
// read the same answer.
const HISTORY_POLL_MS = 5 * 60_000;

/**
 * The last day of searches, refreshed every few minutes.
 * @returns The history, null before it lands, and whether the last read failed.
 */
function useQueueHistory(): { failed: boolean; history: QueueHistory | null } {
  const [history, setHistory] = useState<QueueHistory | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const read = (): void => {
      ky.get(`${API_BASE_URL}/galaxy/kmindex/queue/history`, {
        retry: 0,
        signal: controller.signal,
        timeout: 120000,
      })
        .json<QueueHistory>()
        .then((next) => {
          setHistory(next);
          setFailed(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        });
    };
    read();
    const timer = setInterval(read, HISTORY_POLL_MS);
    return (): void => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);
  return { failed, history };
}

/**
 * A wait for display, or a dash when there's nothing to measure.
 * @param minutes - Minutes, or null.
 * @returns Text.
 */
function waitText(minutes: number | null | undefined): string {
  return minutes === null || minutes === undefined ? "–" : formatWait(minutes);
}

/**
 * One labelled figure.
 * @param props - Component props.
 * @param props.label - What it is.
 * @param props.value - The figure.
 * @returns The stat.
 */
const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element => (
  <div>
    <Typography color="textSecondary" variant="caption">
      {label}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </div>
);

/**
 * Each search's wait, drawn with vega-lite.
 * @param props - Component props.
 * @param props.history - The history to draw.
 * @returns The chart.
 */
const WaitChart = ({ history }: { history: QueueHistory }): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spec = useMemo(() => buildWaitSpec(history.rows), [history.rows]);
  useEffect(() => {
    let result: { finalize: () => void } | null = null;
    let cancelled = false;
    const draw = async (): Promise<void> => {
      if (!containerRef.current) return;
      // Imported here so the stats page alone pays for vega.
      const { default: embed } = await import("vega-embed");
      if (cancelled || !containerRef.current) return;
      const embedded = await embed(containerRef.current, spec, {
        actions: false,
        renderer: "svg",
      });
      if (cancelled) {
        embedded.finalize();
        return;
      }
      result = embedded;
    };
    draw().catch((error) =>
      console.error("Failed to draw the queue chart:", error)
    );
    return (): void => {
      cancelled = true;
      if (result) result.finalize();
    };
  }, [spec]);
  return <ChartBox ref={containerRef} />;
};

/**
 * Unlisted: how long Logan searches have waited to start, now and over the
 * last day. For the people running the service and the courses that use it.
 * @returns The page.
 */
export const QueueStatsView = (): JSX.Element => {
  const queue = useKmindexQueue(true);
  const { failed, history } = useQueueHistory();
  const hours = useMemo(
    () => (history ? hourlyBuckets(history.rows) : []),
    [history]
  );

  return (
    <>
      <LoganHero
        head="Search queue"
        subHead="How long Logan searches have waited to start, right now and over the last day. Counts searches run through the shared BRC account, which includes logan-search.org and anonymous searches here."
        variant="article"
      />
      <ResultsSection>
        <SearchContainer>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography gutterBottom variant="subtitle1">
                Right now
              </Typography>
              <StatGrid>
                <Stat
                  label="Waiting to start"
                  value={queue ? String(queue.waiting) : "–"}
                />
                <Stat
                  label="Running"
                  value={queue ? String(queue.running) : "–"}
                />
                <Stat
                  label="Longest current wait"
                  value={waitText(queue?.oldest_waiting_minutes)}
                />
              </StatGrid>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="subtitle1">
                Last {history?.hours ?? 24} hours
              </Typography>
              {!history ? (
                <Typography color="textSecondary" variant="body2">
                  {failed
                    ? "The history could not be loaded. This page will try again in a few minutes."
                    : "Loading…"}
                </Typography>
              ) : (
                <>
                  <StatGrid>
                    <Stat
                      label="Searches"
                      value={history.searches.toLocaleString()}
                    />
                    <Stat
                      label="Answered from cache"
                      value={history.cache_hits.toLocaleString()}
                    />
                    <Stat
                      label="Median wait"
                      value={waitText(history.wait_p50_minutes)}
                    />
                    <Stat
                      label="90th percentile wait"
                      value={waitText(history.wait_p90_minutes)}
                    />
                    <Stat
                      label="Longest wait"
                      value={waitText(history.wait_max_minutes)}
                    />
                    <Stat
                      label="Median run time"
                      value={waitText(history.run_p50_minutes)}
                    />
                  </StatGrid>
                  {history.rows.length > 0 && <WaitChart history={history} />}
                  {history.truncated && (
                    <Typography color="textSecondary" variant="caption">
                      Galaxy&apos;s job list hit its limit, so the oldest
                      searches in this window are missing.
                    </Typography>
                  )}
                  {hours.length > 0 && (
                    <Table size="small" sx={{ mt: 2 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Hour</TableCell>
                          <TableCell align="right">Searches</TableCell>
                          <TableCell align="right">From cache</TableCell>
                          <TableCell align="right">Median wait</TableCell>
                          <TableCell align="right">Longest wait</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {hours.map((bucket) => (
                          <TableRow key={bucket.hour}>
                            <TableCell>
                              {new Date(bucket.hour).toLocaleString(undefined, {
                                day: "numeric",
                                hour: "numeric",
                                month: "short",
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {bucket.searches}
                            </TableCell>
                            <TableCell align="right">
                              {bucket.cacheHits}
                            </TableCell>
                            <TableCell align="right">
                              {waitText(bucket.medianWait)}
                            </TableCell>
                            <TableCell align="right">
                              {waitText(bucket.longestWait)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <Typography
                    color="textSecondary"
                    sx={{ display: "block", mt: 2 }}
                    variant="caption"
                  >
                    As of{" "}
                    {new Date(history.as_of).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    . Waits are from submission to the search starting; a search
                    answered from cache never waits. Searches still waiting
                    count toward the chart but not the figures above.
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </SearchContainer>
      </ResultsSection>
    </>
  );
};
