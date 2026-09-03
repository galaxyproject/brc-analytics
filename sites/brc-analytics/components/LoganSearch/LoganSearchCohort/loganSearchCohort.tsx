import { CohortGeography } from "@brc/components/LoganSearch/CohortGeography/cohortGeography";
import {
  CohortBarRow,
  CohortBarRows,
  CohortFacetGrid,
  CohortGeographyLayout,
  CohortStat,
  CohortStats,
  ControlRow,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { formatShare } from "@brc/components/LoganSearch/utils";
import { Download } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";
import { API_BASE_URL } from "@repo/shared/config/api";
import {
  type KmindexCohort,
  type KmindexFacet,
  type KmindexResults,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface LoganSearchCohortProps {
  search: ReturnType<typeof useKmindexSearch>;
}

interface CohortExportProps {
  cohort: KmindexCohort;
  // Rows the table below can page through, for the sentence that separates
  // the file from the window onto it.
  listed: number;
  results: KmindexResults;
}

interface CohortBarsProps {
  rows: CohortBar[];
  // Denominator every row is a share of. Passed in rather than re-derived so
  // the caller decides what the rows are claiming to account for.
  total: number;
}

interface CohortBar {
  count: number;
  key: string;
  label: string;
  // Tail and no-value rows: present and counted, but not a finding.
  muted: boolean;
}

// The mirror's column names, which are not what anyone calls these.
const FACET_LABELS: Record<string, string> = {
  assay_type: "Assay type",
  country: "Country of origin",
  instrument: "Instrument",
  librarylayout: "Library layout",
  platform: "Sequencing platform",
  release_year: "Release year",
};

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

/**
 * Display name for a facet, falling back to a de-underscored column name so an
 * unrecognised facet still renders as something readable.
 * @param name - Facet name as the API sends it.
 * @returns Heading text for the facet.
 */
function facetLabel(name: string): string {
  if (FACET_LABELS[name]) return FACET_LABELS[name];
  const spaced = name.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

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
 * Sum a list of counts.
 * @param counts - Counts to add.
 * @returns Their total.
 */
function sum(counts: number[]): number {
  return counts.reduce((running, count) => running + count, 0);
}

/**
 * Flatten a facet into rows that account for every run it counted: the listed
 * values, the tail, and the runs with nothing recorded.
 *
 * The tail and the blanks are rows rather than a footnote because a country
 * chart that shows ten bars and quietly drops a fifth of its runs is the same
 * misreading this whole card exists to stop.
 * @param facet - Facet as the API sends it.
 * @returns Rows in display order.
 */
function facetBars(facet: KmindexFacet): CohortBar[] {
  const rows: CohortBar[] = (facet.values ?? []).map(({ count, value }) => ({
    count,
    key: `value:${value}`,
    label: value,
    muted: false,
  }));
  if (facet.other > 0) {
    rows.push({
      count: facet.other,
      key: "other",
      label: "All other values",
      muted: true,
    });
  }
  if (facet.unknown > 0) {
    rows.push({
      count: facet.unknown,
      key: "unknown",
      label: "Not recorded",
      muted: true,
    });
  }
  return rows;
}

/**
 * How much of the match set the mirror could describe, and what that leaves
 * out of every count on the card.
 * @param cohort - Cohort summary.
 * @returns A sentence, or null when the mirror covered everything.
 */
function describeMirrorCoverage(cohort: KmindexCohort): string | null {
  const missing = cohort.total - cohort.in_mirror;
  if (missing <= 0) return null;
  return (
    `Counted from SRA mirror metadata, which covers ` +
    `${cohort.in_mirror.toLocaleString()} of the ${cohort.total.toLocaleString()} ` +
    `matched runs (${formatShare(cohort.in_mirror, cohort.total)}). The other ` +
    `${missing.toLocaleString()} matched the query but the mirror does not ` +
    `know them, so they are in nothing below.`
  );
}

/**
 * What the top-organism list does and does not cover.
 *
 * Organism is not a facet -- there are far too many distinct values for a top
 * ten to be most of them -- so the list has to say out loud that it stops
 * short of the total rather than implying a breakdown.
 * @param cohort - Cohort summary.
 * @returns A sentence describing the list's coverage.
 */
function describeTopOrganisms(cohort: KmindexCohort): string {
  const shown = cohort.top_organisms.length;
  const listed = sum(cohort.top_organisms.map(({ count }) => count));
  if (cohort.organisms <= shown) {
    return `All ${cohort.organisms.toLocaleString()} organisms the query matched.`;
  }
  return (
    `The ${shown} largest of ${cohort.organisms.toLocaleString()} distinct ` +
    `organisms -- ${listed.toLocaleString()} runs, ` +
    `${formatShare(listed, cohort.in_mirror)} of those with metadata. The ` +
    `remaining ${(cohort.organisms - shown).toLocaleString()} organisms are ` +
    `not listed, so these rows stop well short of the total.`
  );
}

/**
 * Proportional rows: name, bar, count, share.
 * @param props - Component props.
 * @param props.rows - Rows to draw.
 * @param props.total - Denominator the shares are taken against.
 * @returns The rows.
 */
function CohortBars({ rows, total }: CohortBarsProps): JSX.Element {
  return (
    <CohortBarRows>
      {rows.map((row) => (
        <CohortBarRow key={row.key}>
          <Typography
            color={row.muted ? "textSecondary" : "textPrimary"}
            variant="body2"
          >
            {row.label}
          </Typography>
          <LinearProgress
            // Decorative: the count and the share next to it say the same
            // thing in text.
            aria-hidden
            value={total > 0 ? Math.min((row.count / total) * 100, 100) : 0}
            variant="determinate"
            sx={{ borderRadius: 1, height: 6, opacity: row.muted ? 0.4 : 1 }}
          />
          <Typography align="right" variant="body2">
            {row.count.toLocaleString()}
          </Typography>
          <Typography align="right" color="textSecondary" variant="body2">
            {formatShare(row.count, total)}
          </Typography>
        </CohortBarRow>
      ))}
    </CohortBarRows>
  );
}

/**
 * The match set as a file.
 *
 * This hangs off the cohort and not off the table on purpose. The file is
 * every run the query matched, which is what this card is about; the table is
 * an explicit window onto the top of that set. A download button on the window
 * would quietly undo the distinction the card exists to draw.
 * @param props - Component props.
 * @param props.cohort - Cohort summary, for how much of the file the mirror
 * could describe.
 * @param props.listed - Rows the table below can page through.
 * @param props.results - Results payload, for the export fields and the job
 * id the endpoint is keyed on.
 * @returns The download block, or null when there is no file to offer.
 */
function CohortExport({
  cohort,
  listed,
  results,
}: CohortExportProps): JSX.Element | null {
  const rows = results.export_rows ?? 0;

  if (results.export_status !== "available" || rows <= 0) {
    // No file, and for most reasons -- mirror down, export directory
    // unconfigured, file swept -- nothing the reader could do about it, so say
    // nothing rather than explain an absence. Too many matches is the
    // exception: that one a narrower query fixes.
    if (results.export_status !== "too_large") return null;
    return (
      <>
        <Divider sx={{ my: 2 }} />
        <Typography color="textSecondary" component="div" variant="caption">
          Too many matched runs to prepare a download of the full set. A higher
          minimum shared k-mer fraction, or fewer indexes, brings one back.
        </Typography>
      </>
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
  // count -- but their metadata columns are empty. The coverage share is
  // already stated above, so this only says what it means for the file.
  const missing = Math.max(cohort.total - cohort.in_mirror, 0);

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2">Download the whole match set</Typography>
      <Typography
        color="textSecondary"
        component="div"
        sx={{ mb: 1.5 }}
        variant="caption"
      >
        All {rows.toLocaleString()} matched runs with their SRA metadata, in one
        file --{" "}
        {rows > listed
          ? `the set these counts describe, not the ${listed.toLocaleString()} rows the table below pages through.`
          : `the same set as the table below, joined to metadata for every row rather than the page on screen.`}
        {missing > 0 &&
          ` The ${missing.toLocaleString()} runs the mirror does not know are in it too, carrying their hit with the metadata columns left empty.`}
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
      <Typography
        color="textSecondary"
        component="div"
        sx={{ mt: 1 }}
        variant="caption"
      >
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
      </Typography>
    </>
  );
}

/**
 * One facet's heading, denominator and bars.
 * @param props - Component props.
 * @param props.facet - Facet as the API sends it.
 * @returns The facet block.
 */
function CohortFacetBlock({ facet }: { facet: KmindexFacet }): JSX.Element {
  const rows = facetBars(facet);
  // The facet's own parts, so the shares are guaranteed to add up even if a
  // facet ever counts a different set from in_mirror.
  const facetTotal = sum(rows.map((row) => row.count));
  return (
    <div>
      <Typography variant="subtitle2">{facetLabel(facet.name)}</Typography>
      <Typography color="textSecondary" variant="caption">
        {facetTotal.toLocaleString()} runs
      </Typography>
      <CohortBars rows={rows} total={facetTotal} />
    </div>
  );
}

export const LoganSearchCohort = ({
  search,
}: LoganSearchCohortProps): JSX.Element | null => {
  const { results } = search;
  const cohort = results?.cohort;

  // Absent on an older backend, and on a job whose mirror was unavailable. A
  // shell of zeroes would read as "your query matched nothing", which is a
  // different and wrong claim.
  // `results` is redundant to the runtime check -- no results, no cohort --
  // but naming it is what lets the export block below take the payload rather
  // than re-deriving each field through an optional chain.
  if (!results || !cohort || cohort.total <= 0) return null;

  const listed = results.total_hits ?? 0;
  const geography = results.geography ?? null;
  const facets = cohort.facets ?? [];
  // The country facet is lifted out of the grid and set beside the map, but
  // only when there is a map to set it beside. With no geography it stays
  // where it has always been rather than leaving half a row empty.
  const countryFacet = geography
    ? (facets.find((facet) => facet.name === "country") ?? null)
    : null;
  const gridFacets = countryFacet
    ? facets.filter((facet) => facet !== countryFacet)
    : facets;
  // The two cards describe different sets whenever the cap bit. Derived from
  // the counts rather than the truncated flag because it is precisely the gap
  // between these two numbers that the reader has to be told about.
  const isTruncated = cohort.total > listed;
  const mirrorNote = describeMirrorCoverage(cohort);

  // Full width above the facet grid rather than inside it. A grid cell is
  // about 560px on a 1200px page, which is not enough for a world map to be
  // worth drawing -- and the bars stay, because a choropleth cannot say "812
  // runs from Malawi" and should not try.
  const geographyBlock = geography ? (
    <>
      <Divider sx={{ my: 2 }} />
      <CohortGeographyLayout>
        <CohortGeography geography={geography} />
        {countryFacet && <CohortFacetBlock facet={countryFacet} />}
      </CohortGeographyLayout>
    </>
  ) : null;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography color="textSecondary" variant="subtitle2">
          Every run this query matched
        </Typography>
        <Typography variant="h6">
          {cohort.total.toLocaleString()} runs
        </Typography>
        <CohortStats>
          <CohortStat>
            <Typography variant="subtitle1">
              {cohort.organisms.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              organisms
            </Typography>
          </CohortStat>
          <CohortStat>
            <Typography variant="subtitle1">
              {cohort.bioprojects.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              BioProjects
            </Typography>
          </CohortStat>
          <CohortStat>
            <Typography variant="subtitle1">
              {cohort.studies.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              SRA studies
            </Typography>
          </CohortStat>
          <CohortStat>
            <Typography variant="subtitle1">
              {cohort.countries.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              countries
            </Typography>
          </CohortStat>
        </CohortStats>

        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>
            These counts describe the whole match set, not the table below.
          </AlertTitle>
          {isTruncated ? (
            <Typography variant="body2">
              All {cohort.total.toLocaleString()} matched runs are counted here.
              The table below lists {listed.toLocaleString()} of them: the top
              of the score range, which over-represents whatever is common at
              the top. Counting those rows gives different answers, up to and
              including a different top organism. Where the two disagree, these
              are the numbers that describe your search.
            </Typography>
          ) : (
            <Typography variant="body2">
              Nothing was cut: these counts and the {listed.toLocaleString()}{" "}
              rows in the table below describe the same set of runs, which the
              table pages through a screen at a time.
            </Typography>
          )}
        </Alert>

        {mirrorNote && (
          <Typography color="textSecondary" sx={{ mt: 2 }} variant="body2">
            {mirrorNote}
          </Typography>
        )}

        {/* Directly under the claim it follows from: having just been told
            these counts describe a set the table cannot show you, the next
            useful thing is the set itself. */}
        <CohortExport cohort={cohort} listed={listed} results={results} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Top organisms</Typography>
        <Typography color="textSecondary" variant="caption">
          {describeTopOrganisms(cohort)}
        </Typography>
        <CohortBars
          rows={cohort.top_organisms.map(({ count, value }) => ({
            count,
            key: `organism:${value}`,
            label: value,
            muted: false,
          }))}
          total={cohort.in_mirror}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Metadata breakdown</Typography>
        <Typography
          color="textSecondary"
          component="div"
          sx={{ mb: 2 }}
          variant="caption"
        >
          Each breakdown accounts for every run with metadata -- the largest
          values, everything else, and the runs with nothing recorded -- so its
          shares add to 100%.
        </Typography>
        {geographyBlock}

        <CohortFacetGrid>
          {gridFacets.map((facet) => (
            <CohortFacetBlock facet={facet} key={facet.name} />
          ))}
        </CohortFacetGrid>

        <Typography
          color="textSecondary"
          sx={{ display: "block", mt: 2 }}
          variant="caption"
        >
          {/* Was "nothing here is clickable", which the download above makes
              false. The claim that has to survive is about the breakdowns,
              not about the card. */}
          Counts only -- these values are not filters. Narrowing by a value
          would have to run over the whole match set to stay honest, and
          applying it to the listed rows alone would reintroduce exactly the
          skew these counts are here to correct.
        </Typography>
      </CardContent>
    </Card>
  );
};
