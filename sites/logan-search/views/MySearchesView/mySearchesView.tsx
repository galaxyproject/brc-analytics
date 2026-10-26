import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { editSearchHref, resultsHref, ROUTES } from "@logan/routes/constants";
import {
  ResultsSection,
  SearchContainer,
} from "@logan/views/LoganSearchSiteView/loganSearchSiteView.styles";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  type ChipProps,
  Link,
  Typography,
} from "@mui/material";
import { describeSearchScope } from "@repo/shared/components/LoganSearch/LoganQueryStrip/loganQueryStrip";
import { type RecentSearch } from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import { useRecentSearches } from "@repo/shared/components/LoganSearch/LoganSearchHistory/useRecentSearches";
import {
  describeQueue,
  formatWait,
} from "@repo/shared/components/LoganSearch/LoganSearchStatus/queueNote";
import { sortIndexes } from "@repo/shared/components/LoganSearch/utils";
import { API_BASE_URL } from "@repo/shared/config/api";
import { useKmindexQueue } from "@repo/shared/hooks/useKmindexQueue";
import ky from "ky";
import { type JSX, useEffect, useState } from "react";
import {
  ListHeader,
  RowCount,
  RowText,
  SearchList,
  SearchRow,
} from "./mySearchesView.styles";
import { type SearchStatus, useSearchStatuses } from "./useSearchStatuses";

const STATUS_CHIPS: Record<
  SearchStatus,
  { color: ChipProps["color"]; label: string }
> = {
  checking: { color: "default", label: "Checking" },
  done: { color: "success", label: "Done" },
  expired: { color: "default", label: "Expired" },
  failed: { color: "error", label: "Failed" },
  queued: { color: "warning", label: "Queued" },
  running: { color: "primary", label: "Running" },
  unknown: { color: "default", label: "Unknown" },
};

/**
 * Every registered index, to name the preset a search used. Without it the
 * rows just count their indexes.
 * @returns The sorted index names, empty until they load.
 */
function useRegisteredIndexes(): string[] {
  const [indexes, setIndexes] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    ky.get(`${API_BASE_URL}/galaxy/kmindex/indexes`, {
      credentials: "include",
      timeout: 30000,
    })
      .json<{ indexes: string[] }>()
      .then(({ indexes }) => {
        if (!cancelled) setIndexes(sortIndexes(indexes));
      })
      .catch(() => undefined);
    return (): void => {
      cancelled = true;
    };
  }, []);
  return indexes;
}

/**
 * How long a search has been waiting since this browser submitted it.
 * @param submittedAt - ISO 8601 timestamp.
 * @returns E.g. "waiting 1 h 12 min", or null if the time doesn't parse.
 */
function waitingFor(submittedAt: string): string | null {
  const since = new Date(submittedAt).getTime();
  if (Number.isNaN(since)) return null;
  return `waiting ${formatWait(Math.max(0, Date.now() - since) / 60000)}`;
}

/**
 * When a search was submitted, in the reader's locale.
 * @param submittedAt - ISO 8601 timestamp.
 * @returns The formatted time, or the raw value if it doesn't parse.
 */
function formatSubmitted(submittedAt: string): string {
  const date = new Date(submittedAt);
  return Number.isNaN(date.getTime())
    ? submittedAt
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

interface SearchItemProps {
  entry: RecentSearch;
  registered: string[];
  status: SearchStatus;
}

/**
 * One stored search: its status, what it was, and what it found.
 * @param props - Component props.
 * @param props.entry - The stored search.
 * @param props.registered - Every registered index name.
 * @param props.status - Where its job stands.
 * @returns The row.
 */
const SearchItem = ({
  entry,
  registered,
  status,
}: SearchItemProps): JSX.Element => {
  const chip = STATUS_CHIPS[status];
  const label = entry.queryName ?? `Job ${entry.jobId}`;
  const expired = status === "expired";
  const waiting = status === "queued" ? waitingFor(entry.submittedAt) : null;
  return (
    <SearchRow>
      <Chip
        color={chip.color}
        label={chip.label}
        size="small"
        sx={{ justifySelf: "start" }}
        variant={status === "checking" ? "outlined" : "filled"}
      />
      <RowText>
        {expired ? (
          <Typography
            color="textSecondary"
            component="span"
            variant="subtitle2"
          >
            {label}
          </Typography>
        ) : (
          <Link href={resultsHref(entry.jobId)} variant="subtitle2">
            {label}
          </Link>
        )}
        <Typography color="textSecondary" component="div" variant="caption">
          {describeSearchScope(registered, entry.indexes)} · threshold{" "}
          {entry.threshold.toFixed(2)} · {formatSubmitted(entry.submittedAt)}
          {waiting && ` · ${waiting}`}
          {expired && entry.sequence && (
            <>
              {" · "}
              <Link href={editSearchHref(entry.jobId)}>Run it again</Link>
            </>
          )}
        </Typography>
      </RowText>
      <RowCount>
        {entry.totalMatches !== undefined && !expired ? (
          <Typography variant="body2">
            <strong>{entry.totalMatches.toLocaleString()}</strong>{" "}
            {entry.totalMatches === 1 ? "run" : "runs"}
          </Typography>
        ) : (
          <Typography color="textSecondary" variant="body2">
            –
          </Typography>
        )}
      </RowCount>
    </SearchRow>
  );
};

/**
 * The searches this browser has run, newest first, each with where its job
 * stands and a way back to its results.
 * @returns the page.
 */
export const MySearchesView = (): JSX.Element => {
  const { clear, searches } = useRecentSearches();
  const registered = useRegisteredIndexes();
  const statuses = useSearchStatuses(searches.map(({ jobId }) => jobId));
  const anyQueued = Object.values(statuses).includes("queued");
  // Only while one of these is waiting: the backlog is the answer to "is mine
  // dead?", and noise otherwise.
  const queue = useKmindexQueue(anyQueued);
  const queueNote = anyQueued ? describeQueue(queue) : null;

  return (
    <>
      <LoganHero
        head="My searches"
        subHead="Saved in this browser only. A search's results stay reachable for as long as Galaxy keeps its job."
        variant="article"
      />
      <ResultsSection>
        <SearchContainer>
          <Card>
            <CardContent>
              {searches.length === 0 ? (
                <>
                  <Typography gutterBottom variant="h6">
                    No searches yet
                  </Typography>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Searches you run from this browser are listed here, so you
                    can get back to their results.
                  </Typography>
                  <Button href={ROUTES.SEARCH} variant="contained">
                    Start a search
                  </Button>
                </>
              ) : (
                <>
                  <ListHeader>
                    <Typography color="textSecondary" variant="body2">
                      {searches.length === 1
                        ? "1 search"
                        : `${searches.length} searches`}
                      , newest first
                    </Typography>
                    <Button onClick={clear} size="small">
                      Clear all
                    </Button>
                  </ListHeader>
                  {anyQueued && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {queueNote && `${queueNote} `}A queued search hasn&apos;t
                      failed. It&apos;s waiting its turn, and its results will
                      be here when it finishes.
                    </Alert>
                  )}
                  <SearchList>
                    {searches.map((entry) => (
                      <SearchItem
                        entry={entry}
                        key={entry.jobId}
                        registered={registered}
                        status={statuses[entry.jobId]}
                      />
                    ))}
                  </SearchList>
                </>
              )}
            </CardContent>
          </Card>
        </SearchContainer>
      </ResultsSection>
    </>
  );
};
