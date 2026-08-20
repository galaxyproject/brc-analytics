import {
  CohortBarRow,
  CohortBarRows,
  CohortFacetGrid,
  CohortStat,
  CohortStats,
} from "@brc/components/LoganSearch/loganSearch.styles";
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";
import {
  type KmindexCohort,
  type KmindexFacet,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface LoganSearchCohortProps {
  search: ReturnType<typeof useKmindexSearch>;
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
 * A count as a share of its denominator.
 *
 * Both ends of the scale round into a claim the count contradicts. "0.0%"
 * reports a value that matched as one that did not; "100.0%" short of the
 * total reports a remainder that exists as one that does not -- and the
 * sentence next to it names that remainder, or the row under it shows it as
 * "<0.1%" and the column sums past 100%. So neither rounding is allowed to
 * reach its limit unless the count actually does.
 * @param count - Rows with this value.
 * @param total - Rows the facet counted in all.
 * @returns Percentage string.
 */
function formatShare(count: number, total: number): string {
  if (total <= 0) return "--";
  if (count === 0) return "0%";
  const share = (count / total) * 100;
  if (share < 0.1) return "<0.1%";
  if (count < total && share > 99.9) return ">99.9%";
  return `${share.toFixed(1)}%`;
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

export const LoganSearchCohort = ({
  search,
}: LoganSearchCohortProps): JSX.Element | null => {
  const { results } = search;
  const cohort = results?.cohort;

  // Absent on an older backend, and on a job whose mirror was unavailable. A
  // shell of zeroes would read as "your query matched nothing", which is a
  // different and wrong claim.
  if (!cohort || cohort.total <= 0) return null;

  const listed = results?.total_hits ?? 0;
  // The two cards describe different sets whenever the cap bit. Derived from
  // the counts rather than the truncated flag because it is precisely the gap
  // between these two numbers that the reader has to be told about.
  const isTruncated = cohort.total > listed;
  const mirrorNote = describeMirrorCoverage(cohort);

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
        <CohortFacetGrid>
          {(cohort.facets ?? []).map((facet) => {
            const rows = facetBars(facet);
            // The facet's own parts, so the shares are guaranteed to add up
            // even if a facet ever counts a different set from in_mirror.
            const facetTotal = sum(rows.map((row) => row.count));
            return (
              <div key={facet.name}>
                <Typography variant="subtitle2">
                  {facetLabel(facet.name)}
                </Typography>
                <Typography color="textSecondary" variant="caption">
                  {facetTotal.toLocaleString()} runs
                </Typography>
                <CohortBars rows={rows} total={facetTotal} />
              </div>
            );
          })}
        </CohortFacetGrid>

        <Typography
          color="textSecondary"
          sx={{ display: "block", mt: 2 }}
          variant="caption"
        >
          Counts only, nothing here is clickable. Narrowing by a value would
          have to run over the whole match set to stay honest, and applying it
          to the listed rows alone would reintroduce exactly the skew these
          counts are here to correct.
        </Typography>
      </CardContent>
    </Card>
  );
};
