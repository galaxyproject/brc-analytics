import { Link as LinkIcon } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import { type RecentSearch } from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import {
  countBases,
  indexPresets,
  selectIndexes,
} from "@repo/shared/components/LoganSearch/utils";
import { type KmindexResults } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX, useState } from "react";
import {
  Strip,
  StripActions,
  StripFacts,
  StripQuery,
  StripSequence,
} from "./loganQueryStrip.styles";

const COPY_LABELS = {
  copied: "Link copied",
  failed: "Couldn't copy",
  idle: "Copy link",
} as const;

interface LoganQueryStripProps {
  // Builds the link that reopens the form filled in from a stored search.
  editHref: (jobId: string) => string;
  // What this browser kept when it submitted the search. Absent for a job
  // opened from someone else's link, which is why everything here falls
  // back to what the results say, or leaves the fact out.
  entry?: RecentSearch;
  jobId: string;
  newHref: string;
  // Every registered index, to name a preset the search matched.
  registered: string[];
  results: KmindexResults | null;
}

/**
 * The query's sequence with its header and line breaks taken out.
 * @param fasta - The query as submitted.
 * @returns The bases on one line.
 */
function sequenceLine(fasta: string): string {
  return fasta
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(">"))
    .join("")
    .replace(/\s+/g, "");
}

/**
 * Which indexes a search ran over, by preset name when it was exactly one.
 * @param registered - Every registered index name.
 * @param indexes - The indexes searched.
 * @returns e.g. "Eukaryotes · 6 indexes", or just the count.
 */
export function describeSearchScope(
  registered: string[],
  indexes: string[]
): string {
  const count = `${indexes.length.toLocaleString()} ${indexes.length === 1 ? "index" : "indexes"}`;
  const key = [...indexes].sort().join(",");
  const preset = indexPresets(registered).find(
    (candidate) =>
      selectIndexes(registered, candidate.divisions, candidate.strategies)
        .slice()
        .sort()
        .join(",") === key
  );
  return preset ? `${preset.label} · ${count}` : count;
}

/**
 * What was searched, above its results: the query, the indexes, the
 * threshold and the job, with the ways to edit it, start over or share it.
 * @param props - Component props.
 * @param props.editHref - Builds the edit link.
 * @param props.entry - This browser's record of the search, if it has one.
 * @param props.jobId - The job on screen.
 * @param props.newHref - Where a new search starts.
 * @param props.registered - Every registered index name.
 * @param props.results - The landed results, or null while running.
 * @returns The strip.
 */
export const LoganQueryStrip = ({
  editHref,
  entry,
  jobId,
  newHref,
  registered,
  results,
}: LoganQueryStripProps): JSX.Element => {
  const [copied, setCopied] = useState<keyof typeof COPY_LABELS>("idle");

  const name = entry?.queryName ?? results?.query_name ?? `Job ${jobId}`;
  const sequence = entry?.sequence;
  const indexes =
    entry?.indexes ?? results?.per_index.map(({ index }) => index) ?? [];

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("copied");
    } catch {
      // No clipboard outside a secure context, or the browser refused.
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2000);
  };

  return (
    <Strip aria-label="Search details">
      <StripQuery>
        <Typography component="h1" noWrap variant="subtitle1">
          {name}
        </Typography>
        {sequence && <StripSequence>{sequenceLine(sequence)}</StripSequence>}
      </StripQuery>
      <StripFacts>
        {sequence && (
          <Typography color="textSecondary" variant="body2">
            {countBases(sequence).toLocaleString()} bp
          </Typography>
        )}
        {indexes.length > 0 && (
          <Typography color="textSecondary" variant="body2">
            {describeSearchScope(registered, indexes)}
          </Typography>
        )}
        {entry && (
          <Typography color="textSecondary" variant="body2">
            threshold {entry.threshold.toFixed(2)}
          </Typography>
        )}
        <Typography color="textSecondary" variant="body2">
          job {jobId}
        </Typography>
      </StripFacts>
      <StripActions>
        {/* Only with the sequence to refill the form from; a link from
            someone else's browser has none. */}
        {sequence && (
          <Button href={editHref(jobId)} size="small" variant="outlined">
            Edit search
          </Button>
        )}
        <Button href={newHref} size="small" variant="outlined">
          New search
        </Button>
        <Button onClick={copyLink} size="small" startIcon={<LinkIcon />}>
          {COPY_LABELS[copied]}
        </Button>
      </StripActions>
    </Strip>
  );
};
