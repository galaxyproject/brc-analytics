import {
  CohortStat,
  CohortStats,
  ControlRow,
  SummaryActions,
  SummaryFigures,
  SummaryHeader,
  SummaryMeta,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { ROUTES } from "@brc/routes/constants";
import { AutoAwesome, Download, Link as LinkIcon } from "@mui/icons-material";
import { Button, Card, CardContent, Tooltip, Typography } from "@mui/material";
import { API_BASE_URL } from "@repo/shared/config/api";
import {
  type KmindexCohort,
  type KmindexResults,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import Link from "next/link";
import { type JSX, useState } from "react";

interface LoganSearchSummaryProps {
  search: ReturnType<typeof useKmindexSearch>;
}

interface SummaryExportProps {
  // Null on a backend predating the cohort, and on a job whose mirror was
  // unavailable -- which is exactly when there is no coverage to report.
  cohort: KmindexCohort | null;
  results: KmindexResults;
}

// What one exported row costs as TSV. The API reports the parquet's exact
// size but not the TSV's, because the TSV is converted on the way out and
// never exists as a file to measure. The row count is enough to size it
// anyway: the column set is fixed, so per-row width is a property of the
// format more than of the data. Measured by running the backend's own export
// and TSV writer over both real corpora -- 148.2 B/row across 1,133,516 rows
// (168.0 MB) and 147.4 across 1,514,202 (223.2 MB) -- so 148 lands within
// 0.4% of both. Rendered with a "~" regardless, since it is derived and the
// parquet size beside it is not.
const TSV_BYTES_PER_ROW = 148;

// Excel and LibreOffice Calc both stop at 1,048,576 rows and truncate the rest
// with a single dismissable warning. This export exists because the 50,000 rows
// on screen misrepresent the match set, so steering someone to a format that
// silently drops the tail would reintroduce the same problem in a new place --
// and the measured job is 1,133,516 rows, over the limit.
const SPREADSHEET_ROW_LIMIT = 1048576;

// What the copy button says in each of its three states.
const COPY_LABELS = {
  copied: "Copied",
  failed: "Copy failed",
  idle: "Copy link",
};

/**
 * Bytes as a short size.
 *
 * The two formats sit an order of magnitude apart -- a 15.6 MB parquet beside
 * a 168 MB TSV, and further apart still on a large match set -- so a fixed
 * number of decimals is either a lost digit at the bottom of that range or
 * noise at the top.
 * @param bytes - Size in bytes.
 * @returns Size in decimal units.
 */
function formatBytes(bytes: number): string {
  const mb = bytes / 1e6;
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  if (mb >= 100) return `${Math.round(mb)} MB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  // A sub-kilobyte export would still be a file worth naming, so don't let it
  // round to "0 kB".
  return `${Math.max(Math.round(bytes / 1e3), 1)} kB`;
}

/**
 * Which indexes the search ran over, and what each of them matched.
 *
 * The per-index counts are a fact about the search rather than about the
 * cohort, which is why they sit on this line and not in the breakdown card.
 * With one index the count is the headline count again, so only the name is
 * worth saying.
 * @param results - Results payload, for the per-index breakdown.
 * @returns A sentence, or null when the backend sent no breakdown.
 */
function describeIndexes(results: KmindexResults): string | null {
  const perIndex = results.per_index ?? [];
  if (perIndex.length === 0) return null;
  if (perIndex.length === 1) return `Searched ${perIndex[0].index}`;
  // Largest first: selection order buries which index got swamped by which.
  // Counted before the cap, because the cap's per-index effect is already
  // explained in the table's own disclosure.
  const named = [...perIndex]
    .sort((a, b) => b.hits_before_cap - a.hits_before_cap)
    .map(
      (summary) =>
        `${summary.index} (${summary.hits_before_cap.toLocaleString()} matched)`
    );
  return `Searched ${named.join(", ")}`;
}

/**
 * The match set as a file.
 *
 * The file is every run the query matched, which is what this strip is about;
 * the table below is an explicit window onto the top of that set. Hanging the
 * download off the window would quietly undo the distinction.
 * @param props - Component props.
 * @param props.cohort - Cohort summary, for how much of the file the mirror
 * could describe.
 * @param props.results - Results payload, for the export fields and the job
 * id the endpoint is keyed on.
 * @returns The download block, or null when there is no file to offer.
 */
function SummaryExport({
  cohort,
  results,
}: SummaryExportProps): JSX.Element | null {
  const rows = results.export_rows ?? 0;

  if (results.export_status !== "available" || rows <= 0) {
    // No file, and for most reasons -- mirror down, export directory
    // unconfigured, file swept -- nothing the reader could do about it, so say
    // nothing rather than explain an absence. Too many matches is the
    // exception: that one a narrower query fixes.
    if (results.export_status !== "too_large") return null;
    return (
      <Typography color="textSecondary" component="div" variant="caption">
        Too many matched runs to prepare a download of the full set. A higher
        minimum shared k-mer fraction, or fewer indexes, brings one back.
      </Typography>
    );
  }

  const exportUrl = `${API_BASE_URL}/galaxy/kmindex/jobs/${results.job_id}/export`;
  // The parquet's real size, so it goes on the button unqualified. A backend
  // that reports availability without a size gets a bare "Parquet" rather
  // than a fabricated number or a "0 kB".
  const parquetSize = results.export_bytes
    ? ` · ${formatBytes(results.export_bytes)}`
    : "";
  // Runs that matched but that the mirror has never heard of. They are in the
  // file -- dropping them would make the row count disagree with the match
  // count -- but their metadata columns are empty. Without a cohort there is
  // no coverage to subtract, so nothing is claimed.
  const missing = cohort ? Math.max(cohort.total - cohort.in_mirror, 0) : 0;

  return (
    <>
      {/* The count is the headline directly above and it is in both button
          labels, so this line says what the file is, not how big it is. */}
      <Typography color="textSecondary" component="div" variant="caption">
        Download every matched run with its SRA metadata
      </Typography>
      <ControlRow>
        <Button
          aria-label={`Download all ${rows.toLocaleString()} matched runs as TSV`}
          component="a"
          download
          href={`${exportUrl}?format=tsv`}
          size="small"
          startIcon={<Download />}
          variant="outlined"
        >
          TSV · ~{formatBytes(rows * TSV_BYTES_PER_ROW)}
        </Button>
        <Button
          aria-label={`Download all ${rows.toLocaleString()} matched runs as Parquet`}
          component="a"
          download
          href={`${exportUrl}?format=parquet`}
          size="small"
          startIcon={<Download />}
          variant="outlined"
        >
          Parquet{parquetSize}
        </Button>
      </ControlRow>
      <Typography color="textSecondary" component="div" variant="caption">
        {rows > SPREADSHEET_ROW_LIMIT ? (
          <>
            Too many rows for a spreadsheet -- Excel and Calc stop at{" "}
            {SPREADSHEET_ROW_LIMIT.toLocaleString()} and drop the rest without
            saying which. Parquet is the smaller download, keeps its column
            types, and reads whole in pandas, R or DuckDB.
          </>
        ) : (
          <>
            TSV opens in a spreadsheet. Parquet is the smaller download and
            keeps its column types, for pandas, R or DuckDB.
          </>
        )}
        {missing > 0 &&
          ` Includes the ${missing.toLocaleString()} runs the mirror has no metadata for, with those columns empty.`}
      </Typography>
    </>
  );
}

/**
 * What the search found, above the rows it found it in: the match count, the
 * shape of the set behind it, the file, the assistant, and the job this all
 * came from.
 * @param props - Component props.
 * @param props.search - The kmindex search hook.
 * @returns The strip, or null before there is a match to summarise.
 */
export const LoganSearchSummary = ({
  search,
}: LoganSearchSummaryProps): JSX.Element | null => {
  const { jobId, results } = search;
  const [copied, setCopied] = useState<"copied" | "failed" | "idle">("idle");

  if (!jobId || !results) return null;
  // A backend predating the breakdown sends no total_matches, and reading it
  // unguarded would head the strip with "NaN runs matched".
  const matched = results.total_matches ?? results.total_hits;
  // The table's own empty-state Alert already says nothing matched, and it
  // says it better than a strip headed with a zero.
  if (matched <= 0) return null;
  const cohort = results.cohort ?? null;
  const indexes = describeIndexes(results);

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("copied");
    } catch {
      // No clipboard outside a secure context, or the browser refused.
      // Saying so beats a button that silently does nothing.
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2000);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <SummaryHeader>
          <SummaryFigures>
            <Typography component="h2" variant="h5">
              {matched.toLocaleString()} runs matched
            </Typography>
            {cohort && (
              <CohortStats>
                <CohortStat>
                  <Typography component="div" variant="subtitle1">
                    {cohort.organisms.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    organisms
                  </Typography>
                </CohortStat>
                <CohortStat>
                  <Typography component="div" variant="subtitle1">
                    {cohort.bioprojects.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    BioProjects
                  </Typography>
                </CohortStat>
                <CohortStat>
                  <Typography component="div" variant="subtitle1">
                    {cohort.studies.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    SRA studies
                  </Typography>
                </CohortStat>
                <CohortStat>
                  <Typography component="div" variant="subtitle1">
                    {cohort.countries.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary" variant="caption">
                    countries
                  </Typography>
                </CohortStat>
              </CohortStats>
            )}
          </SummaryFigures>
          <SummaryActions>
            <SummaryExport cohort={cohort} results={results} />
            {/* A Tooltip rather than a title attribute: the title never
                opens on focus, so what the button leads to was reachable
                with a pointer only. Describing rather than naming, because a
                string title is handed to the child as its aria-label, and a
                140-character name with no "Ask the assistant" in it is a
                link nobody can ask for by the words on it. */}
            <Tooltip
              describeChild
              title="The assistant can explain what this cohort is, say which of its organisms are in BRC, and set up a Galaxy analysis on the top runs."
            >
              <Button
                component={Link}
                href={`${ROUTES.ASSISTANT}?loganJob=${encodeURIComponent(
                  jobId
                )}`}
                size="small"
                startIcon={<AutoAwesome />}
                variant="outlined"
              >
                Ask the assistant
              </Button>
            </Tooltip>
          </SummaryActions>
        </SummaryHeader>
        <SummaryMeta>
          <Typography color="textSecondary" variant="caption">
            Job {jobId}
          </Typography>
          {/* Its own caption rather than a dot-joined tail on the job: the
              row already spaces what it holds. */}
          {results.query_name && (
            <Typography color="textSecondary" variant="caption">
              Query {results.query_name}
            </Typography>
          )}
          {indexes && (
            <Typography color="textSecondary" variant="caption">
              {indexes}
            </Typography>
          )}
          <Button onClick={copyLink} size="small" startIcon={<LinkIcon />}>
            {COPY_LABELS[copied]}
          </Button>
        </SummaryMeta>
      </CardContent>
    </Card>
  );
};
