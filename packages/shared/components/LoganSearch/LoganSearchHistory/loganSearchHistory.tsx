import { ROUTES } from "@brc/routes/constants";
import {
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { type JSX } from "react";
import { type RecentSearch } from "./recentSearches";

interface LoganSearchHistoryProps {
  // The job on screen, marked in the list rather than linked to itself.
  currentJobId: string | null;
  onClear: () => void;
  searches: RecentSearch[];
}

// Past this the line stops being something you can read at a glance; the
// count says the rest.
const INDEXES_SHOWN = 3;

/**
 * The indexes a search ran against, short enough for one line.
 * @param indexes - Index names as submitted.
 * @returns e.g. "GENOMIC_INV, GENOMIC_BCT and 4 more".
 */
export function describeSearchIndexes(indexes: string[]): string {
  if (indexes.length <= INDEXES_SHOWN) return indexes.join(", ");
  const rest = indexes.length - INDEXES_SHOWN;
  return `${indexes.slice(0, INDEXES_SHOWN).join(", ")} and ${rest} more`;
}

/**
 * When a search was submitted, in the reader's locale.
 * @param submittedAt - ISO 8601 timestamp.
 * @returns The formatted time, or the raw value if it doesn't parse.
 */
function formatSubmitted(submittedAt: string): string {
  const date = new Date(submittedAt);
  return Number.isNaN(date.getTime()) ? submittedAt : date.toLocaleString();
}

/**
 * Searches this browser has submitted, each linking back to its results.
 *
 * Kept in localStorage only: anonymous searches have nowhere else to live,
 * and a job id is all it takes to reopen one.
 * @param props - Component props.
 * @param props.currentJobId - The job on screen.
 * @param props.onClear - Called when the list is cleared.
 * @param props.searches - Stored searches, newest first.
 * @returns The list, or null when there is nothing in it.
 */
export const LoganSearchHistory = ({
  currentJobId,
  onClear,
  searches,
}: LoganSearchHistoryProps): JSX.Element | null => {
  if (searches.length === 0) return null;

  return (
    <Card component="section" sx={{ mt: 2 }}>
      <CardContent>
        <Stack
          alignItems="baseline"
          direction="row"
          flexWrap="wrap"
          gap={2}
          justifyContent="space-between"
        >
          <Typography component="h2" variant="h6">
            Recent searches
          </Typography>
          <Button onClick={onClear} size="small" variant="text">
            Clear
          </Button>
        </Stack>
        <Typography color="textSecondary" gutterBottom variant="body2">
          Kept in this browser only. A job&apos;s results stay reachable for as
          long as Galaxy keeps the job.
        </Typography>
        <Stack
          component="ul"
          spacing={1.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {searches.map((entry) => {
            const label = entry.queryName ?? `Job ${entry.jobId}`;
            const isCurrent = entry.jobId === currentJobId;
            return (
              <li key={entry.jobId}>
                {isCurrent ? (
                  <Typography component="span" variant="subtitle2">
                    {label} (on screen)
                  </Typography>
                ) : (
                  // A full page load, not a client-side route change: the
                  // search hook picks up ?job= only on mount.
                  <Link
                    href={`${ROUTES.LOGAN_SEARCH}?job=${encodeURIComponent(entry.jobId)}`}
                    underline="hover"
                    variant="subtitle2"
                  >
                    {label}
                  </Link>
                )}
                <Typography
                  color="textSecondary"
                  component="div"
                  variant="caption"
                >
                  {formatSubmitted(entry.submittedAt)} · threshold{" "}
                  {entry.threshold.toFixed(2)} ·{" "}
                  {describeSearchIndexes(entry.indexes)}
                  {entry.queryName ? ` · job ${entry.jobId}` : ""}
                </Typography>
              </li>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};
