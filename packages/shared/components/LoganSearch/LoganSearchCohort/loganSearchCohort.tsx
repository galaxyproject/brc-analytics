import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Typography,
} from "@mui/material";
import { CohortGeography } from "@repo/shared/components/LoganSearch/CohortGeography/cohortGeography";
import { CohortYears } from "@repo/shared/components/LoganSearch/CohortYears/cohortYears";
import {
  FACET_FIELDS,
  isEmptyFilters,
  NONE_VALUE,
} from "@repo/shared/components/LoganSearch/LoganSearchFilters/filters";
import { type LoganFilterControls } from "@repo/shared/components/LoganSearch/LoganSearchFilters/types";
import {
  CohortBarRow,
  CohortBarRows,
  CohortBarToggle,
  CohortFacetGrid,
  CohortGeographyLayout,
} from "@repo/shared/components/LoganSearch/loganSearch.styles";
import { formatShare } from "@repo/shared/components/LoganSearch/utils";
import {
  type KmindexCohort,
  type KmindexFacet,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type KmindexSummaryState } from "@repo/shared/hooks/useKmindexSummary";
import { type JSX } from "react";

interface LoganSearchCohortProps {
  // Present only with the logan-filters flag on; without it the card is the
  // read-only breakdown it always was.
  filtering?: LoganFilterControls;
  search: ReturnType<typeof useKmindexSearch>;
  // The filtered cohort and geography, read in place of the results' own
  // while a filter is active.
  summary?: KmindexSummaryState;
}

interface CohortBarsProps {
  // Toggles a row's filter value. Absent, the rows are not controls.
  onToggle?: (value: string) => void;
  rows: CohortBar[];
  // Filter values currently picked for this breakdown.
  selected?: string[];
  // Denominator every row is a share of. Passed in rather than re-derived so
  // the caller decides what the rows are claiming to account for.
  total: number;
}

interface CohortBar {
  count: number;
  // The value clicking this row filters by: the value itself, or NONE_VALUE
  // for "Not recorded". Absent for the tail, which is not a choice anyone
  // means (a NOT IN over a top ten that moves with the filters).
  filterValue?: string;
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
    filterValue: value,
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
      filterValue: NONE_VALUE,
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
    `organisms: ${listed.toLocaleString()} runs, ` +
    `${formatShare(listed, cohort.in_mirror)} of those with metadata. The ` +
    `remaining ${(cohort.organisms - shown).toLocaleString()} organisms are ` +
    `not listed, so these rows stop well short of the total.`
  );
}

/**
 * The card's closing line while filtering is on.
 * @param filtering - Filter controls.
 * @returns A sentence.
 */
function describeFilterHint(filtering: LoganFilterControls): string {
  if (filtering.disabledReason) return filtering.disabledReason;
  return (
    "Click a value, a year or a country on the map to filter the table, " +
    "this breakdown and the download by it, over every matched run rather " +
    "than the rows listed above. Click it again to remove it."
  );
}

/**
 * Stand-in for the card while a filtered breakdown is on its way, or when it
 * could not be counted.
 * @param props - Component props.
 * @param props.error - Why it could not be counted, if it could not.
 * @param props.isLoading - Whether the request is still out.
 * @returns The placeholder card.
 */
function FilteredCohortPending({
  error,
  isLoading,
}: {
  error: string | null;
  isLoading: boolean;
}): JSX.Element {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography component="h2" variant="h6">
          How the runs matching these filters break down
        </Typography>
        {error ? (
          <Typography color="textSecondary" variant="body2">
            {error}
          </Typography>
        ) : (
          <>
            <Typography color="textSecondary" variant="body2">
              Counting the runs that match these filters.
            </Typography>
            {isLoading && <LinearProgress sx={{ mt: 1 }} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Proportional rows: name, bar, count, share.
 * @param props - Component props.
 * @param props.onToggle - Toggles a row's value as a filter, when filtering.
 * @param props.rows - Rows to draw.
 * @param props.selected - Values picked for this breakdown.
 * @param props.total - Denominator the shares are taken against.
 * @returns The rows.
 */
function CohortBars({
  onToggle,
  rows,
  selected = [],
  total,
}: CohortBarsProps): JSX.Element {
  // Once a breakdown has a pick, the rows not picked are dimmed rather than
  // hidden: they are still counted, and still one click from being added.
  const picking = selected.length > 0;
  return (
    <CohortBarRows>
      {rows.map((row) => {
        const pressed =
          row.filterValue !== undefined && selected.includes(row.filterValue);
        const dimmed = row.muted || (picking && !pressed);
        const cells = (
          <>
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
              sx={{ borderRadius: 1, height: 6, opacity: dimmed ? 0.4 : 1 }}
            />
            <Typography align="right" variant="body2">
              {row.count.toLocaleString()}
            </Typography>
            <Typography align="right" color="textSecondary" variant="body2">
              {formatShare(row.count, total)}
            </Typography>
          </>
        );
        const { filterValue } = row;
        if (!onToggle || filterValue === undefined) {
          return <CohortBarRow key={row.key}>{cells}</CohortBarRow>;
        }
        return (
          <CohortBarToggle
            aria-pressed={pressed}
            key={row.key}
            onClick={(): void => onToggle(filterValue)}
            type="button"
          >
            {cells}
          </CohortBarToggle>
        );
      })}
    </CohortBarRows>
  );
}

/**
 * One facet's heading, denominator and bars.
 * @param props - Component props.
 * @param props.facet - Facet as the API sends it.
 * @param props.filtering - Filter controls, when filtering is on.
 * @returns The facet block.
 */
function CohortFacetBlock({
  facet,
  filtering,
}: {
  facet: KmindexFacet;
  filtering?: LoganFilterControls;
}): JSX.Element {
  const rows = facetBars(facet);
  const field = FACET_FIELDS[facet.name];
  const active = Boolean(filtering && field && !filtering.disabledReason);
  // The facet's own parts, so the shares are guaranteed to add up even if a
  // facet ever counts a different set from in_mirror.
  const facetTotal = sum(rows.map((row) => row.count));
  return (
    <div>
      {/* A block inside the metadata breakdown, so h4 under that section's
          h3. subtitle2 renders an h6 left to itself, which put every title on
          this card at the same level as every other. */}
      <Typography component="h4" variant="subtitle2">
        {facetLabel(facet.name)}
      </Typography>
      <Typography color="textSecondary" variant="caption">
        {facetTotal.toLocaleString()} runs
      </Typography>
      <CohortBars
        onToggle={
          active && filtering && field
            ? (value): void => filtering.onToggle(field, value)
            : undefined
        }
        rows={rows}
        selected={filtering && field ? filtering.filters[field] : undefined}
        total={facetTotal}
      />
    </div>
  );
}

export const LoganSearchCohort = ({
  filtering,
  search,
  summary,
}: LoganSearchCohortProps): JSX.Element | null => {
  const { results } = search;
  const filtered = Boolean(filtering && !isEmptyFilters(filtering.filters));

  // A filter is active but its breakdown has not landed. The unfiltered
  // cohort is not shown in the meantime: it would sit under a filtered table
  // describing a different set.
  if (results && filtered && !summary?.summary) {
    return (
      <FilteredCohortPending
        error={summary?.error ?? null}
        isLoading={summary?.isLoading ?? false}
      />
    );
  }

  const cohort = filtered ? summary?.summary?.cohort : results?.cohort;

  // Absent on an older backend, and on a job whose mirror was unavailable. A
  // shell of zeroes would read as "your query matched nothing", which is a
  // different and wrong claim.
  if (!results || !cohort || cohort.total <= 0) return null;

  const listed = results.total_hits ?? 0;
  const geography =
    (filtered ? summary?.summary?.geography : results.geography) ?? null;
  const facets = cohort.facets ?? [];
  // The country facet is lifted out of the grid and set beside the map, but
  // only when there is a map to set it beside. With no geography it stays
  // where it has always been rather than leaving half a row empty.
  const countryFacet = geography
    ? (facets.find((facet) => facet.name === "country") ?? null)
    : null;
  // Release year leaves the grid too. A grid block ranks its values by count,
  // which for a year discards the one thing a year is for.
  const yearFacet = facets.find((facet) => facet.name === "release_year");
  const gridFacets = facets.filter(
    (facet) => facet !== countryFacet && facet !== yearFacet
  );
  // The two cards describe different sets whenever the cap bit. Derived from
  // the counts rather than the truncated flag because it is precisely the gap
  // between these two numbers that the reader has to be told about.
  // A filtered table is capped the same way, against what the filter keeps.
  const isTruncated = cohort.total > listed;
  const mirrorNote = describeMirrorCoverage(cohort);
  const scopeNote = filtered
    ? "Counted over every run that matches these filters, the same rows the table above pages through. Each breakdown leaves out its own filter, so the values you did not pick stay visible and can be added."
    : "Counted over every matched run, which the table above pages through a screen at a time.";

  // Full width above the facet grid rather than inside it. A grid cell is
  // about 560px on a 1200px page, which is not enough for a world map to be
  // worth drawing -- and the bars stay, because a choropleth cannot say "812
  // runs from Malawi" and should not try.
  const geographyBlock = geography ? (
    <>
      <Divider sx={{ my: 2 }} />
      <CohortGeographyLayout>
        <CohortGeography
          filtering={filtering}
          geography={geography}
          jobId={results.job_id}
        />
        {countryFacet && (
          <CohortFacetBlock facet={countryFacet} filtering={filtering} />
        )}
      </CohortGeographyLayout>
    </>
  ) : null;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography component="h2" variant="h6">
          How the {cohort.total.toLocaleString()}{" "}
          {filtered ? "runs matching these filters" : "matched runs"} break down
        </Typography>

        {/* The Alert is for the case where the two disagree. When nothing was
            cut there is no disagreement to warn about, and a standing banner
            over the whole card would be teaching the reader to skip it. */}
        {isTruncated ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>
              These counts describe the whole match set, not the table above.
            </AlertTitle>
            <Typography variant="body2">
              Every {filtered ? "run matching these filters" : "matched run"} is
              counted here. The table above lists {listed.toLocaleString()} of
              them: the top of the score range, which over-represents whatever
              is common at the top. Counting those rows gives different answers,
              up to and including a different top organism. Where the two
              disagree, these are the numbers that describe your search.
            </Typography>
          </Alert>
        ) : (
          <Typography color="textSecondary" variant="body2">
            {scopeNote}
          </Typography>
        )}

        {mirrorNote && (
          <Typography color="textSecondary" sx={{ mt: 2 }} variant="body2">
            {mirrorNote}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* The card's two sections, so h3 under its h2 heading. subtitle2 on
            its own renders an h6, which flattened the whole card to one
            level for anything navigating by heading. */}
        <Typography component="h3" variant="subtitle2">
          Top organisms
        </Typography>
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

        <Typography component="h3" variant="subtitle2">
          Metadata breakdown
        </Typography>
        <Typography
          color="textSecondary"
          component="div"
          sx={{ mb: 2 }}
          variant="caption"
        >
          Each breakdown accounts for every run with metadata (the largest
          values, everything else, and the runs with nothing recorded), so its
          shares add to 100%.
        </Typography>
        {geographyBlock}

        <CohortFacetGrid>
          {gridFacets.map((facet) => (
            <CohortFacetBlock
              facet={facet}
              filtering={filtering}
              key={facet.name}
            />
          ))}
        </CohortFacetGrid>

        {/* Full width under the grid: thirteen years in a half-width cell
            gives each year about twenty pixels, which is not a timeline. */}
        {yearFacet && <CohortYears facet={yearFacet} filtering={filtering} />}

        <Typography
          color="textSecondary"
          sx={{ display: "block", mt: 2 }}
          variant="caption"
        >
          {/* Was "nothing here is clickable", which stopped being true once
              the card carried a download. The claim that has to survive is
              about the breakdowns, not about the card. */}
          {filtering
            ? describeFilterHint(filtering)
            : "Counts only. These values are not filters, since narrowing by one would have to run over the whole match set to stay honest."}
        </Typography>
      </CardContent>
    </Card>
  );
};
