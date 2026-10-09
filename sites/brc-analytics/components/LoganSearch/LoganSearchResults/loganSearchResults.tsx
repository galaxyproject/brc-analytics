import {
  CoverageCell,
  CoverageRail,
  MetaCellStyles,
  Numeric,
  OrganismMeta,
  ResultsToolbar,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { ViewColumn } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  LinearProgress,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled as muiStyled } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import {
  appliedSort,
  defaultOrder,
  type KmindexHit,
  type KmindexIndexSummary,
  type KmindexResults,
  type KmindexSort,
  type KmindexSortColumn,
  PAGE_SIZE_OPTIONS,
  type SraRunMetadata,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import {
  type ChangeEvent,
  type ElementType,
  type JSX,
  type ReactNode,
  useState,
} from "react";

interface LoganSearchResultsProps {
  search: ReturnType<typeof useKmindexSearch>;
}

const SRA_RUN_URL = "https://www.ncbi.nlm.nih.gov/sra/?term=";
const BIOPROJECT_URL = "https://www.ncbi.nlm.nih.gov/bioproject/";
const BIOSAMPLE_URL = "https://www.ncbi.nlm.nih.gov/biosample/";
const OPENVIROME_URL = "https://openvirome.com/";

// The filter prefixes OpenVirome reads, as logan-search.org links them.
export type OpenViromeField = "bioproject" | "biosample" | "runId";

// The truncation disclosure, named so the toggle can point aria-controls at
// what it opens. One card per page, so a constant is enough.
const WHY_ID = "logan-why-capped";
const COLUMNS_MENU_ID = "logan-columns-menu";

// How many indexes the disclosure spells out before rolling the rest into one
// line, and they are the ten largest matchers rather than the ten largest
// rows. The disclosure is here to explain what the cap did, and past the ten
// largest every line says the same thing -- matched, kept none -- which the
// rollup says once. A job over all 109 indexes would otherwise answer "why?"
// with 109 lines, most of them about an index the query never reached.
const MAX_INDEX_LINES = 10;

// MUI's styled rather than emotion's: the cell has to keep TableCell's theme
// props, and wrapping a MUI component with a theme-free emotion string drops
// them.
const MetaCell = muiStyled(TableCell)`
  ${MetaCellStyles}
`;

// The chooser only changes columns the narrow layout drops, so on a phone it
// would toggle nothing visible.
const ColumnsButton = muiStyled(Button)`
  ${MetaCellStyles}
`;

type MetaColumnKey = keyof Omit<SraRunMetadata, "organism">;

interface MetaColumn {
  key: MetaColumnKey;
  label: string;
  // Only the columns the API can order by; the rest sort nothing server-side
  // and a header that looks clickable but is not is worse than a plain one.
  sort?: KmindexSortColumn;
}

// Every mirror field the API returns bar the organism, which has its own
// column. The first three are the table as it was before the chooser existed,
// so they stay on by default; the rest are there for the reader who wants to
// tell a WGS run from an amplicon one without leaving the page.
const META_COLUMNS: MetaColumn[] = [
  { key: "platform", label: "Platform", sort: "platform" },
  { key: "country", label: "Country", sort: "country" },
  { key: "release_date", label: "Released", sort: "release_date" },
  { key: "instrument", label: "Instrument" },
  { key: "assay_type", label: "Assay type" },
  { key: "library_layout", label: "Layout" },
  { key: "mbases", label: "Mbases" },
  { key: "bioproject", label: "BioProject" },
  { key: "biosample", label: "BioSample" },
  { key: "study", label: "Study" },
];

export const DEFAULT_META_COLUMNS: MetaColumnKey[] = [
  "platform",
  "country",
  "release_date",
];

// The mirror is a local copy of run metadata for every run in SRA at the time
// it was built, not a BRC-filtered subset -- an earlier tooltip said the
// opposite and taught users to expect misses that should never happen, so a
// genuinely low annotation rate would have read as normal instead of as a bug.
export const MIRROR_SCOPE_NOTE =
  "Metadata comes from a local mirror of SRA holding every run in the " +
  "archive when the mirror was built. A hit with no metadata is a run newer " +
  "than the mirror, or one SRA holds no run record for.";

/**
 * One line saying what the cap did to a single index, and what searching it
 * alone would recover.
 *
 * Three outcomes read alike but mean different things: an index that matched
 * nothing was searched and came up empty, an index that matched but kept
 * nothing was outranked by the others, and an index whose own matches fit
 * inside the cap is the only one that comes back complete on its own -- the
 * large index just moves from most of the cap to all of it.
 * @param summary - Per-index hit counts either side of the cap.
 * @param cap - Rows the listing can hold, i.e. total_hits while truncated.
 * @returns Sentence describing this index's share of the listing.
 */
function describeIndexShare(summary: KmindexIndexSummary, cap: number): string {
  const { hits_after_cap: kept, hits_before_cap: matched } = summary;
  const listed = kept.toLocaleString();
  const total = matched.toLocaleString();
  if (matched === 0) return "no matches";
  if (kept === matched) return `all ${total} listed`;
  const alone =
    matched <= cap
      ? `alone it would return all ${total}`
      : `alone it would still cap at ${cap.toLocaleString()}`;
  if (kept === 0) return `${total} matched, none listed (${alone})`;
  return `${listed} of ${total} listed (${alone})`;
}

/**
 * The one line standing in for every index the disclosure did not spell out.
 *
 * They are the smallest matchers and every index that matched nothing at all,
 * so their lines would read alike -- and the two numbers that differ are worth
 * more summed than repeated.
 * @param rest - Per-index rows past the ones listed individually.
 * @returns The rollup sentence, or null when nothing was left out.
 */
function describeRestIndexes(rest: KmindexIndexSummary[]): string | null {
  if (rest.length === 0) return null;
  const matched = rest.reduce((total, one) => total + one.hits_before_cap, 0);
  const listed = rest.reduce((total, one) => total + one.hits_after_cap, 0);
  return (
    `${rest.length.toLocaleString()} more indexes: ` +
    `${matched.toLocaleString()} matched, ${listed.toLocaleString()} listed.`
  );
}

/**
 * Tooltip text for a hit whose score had a false-positive baseline subtracted.
 * @param hit - A hit with fp_correction set.
 * @returns One sentence naming the raw ratio and the baseline.
 */
function describeCorrection(hit: KmindexHit): string {
  const raw = hit.score + (hit.fp_correction ?? 0);
  return (
    `kmindex reported ${raw.toFixed(4)}. This run's index is saturated and ` +
    `matches about ${(hit.fp_correction ?? 0).toFixed(4)} of any query's ` +
    `k-mers, so that baseline is subtracted, as logan-search.org does.`
  );
}

/**
 * A metadata cell's text, dimmed when the mirror had nothing.
 * @param props - Component props.
 * @param props.numeric - Set for a column of digits, so the value gets the
 * tabular figures the score and the ANI estimate already use.
 * @param props.value - The value, or null/undefined when not recorded.
 * @returns The caption.
 */
function Meta({
  numeric,
  value,
}: {
  numeric?: boolean;
  value?: string | null;
}): JSX.Element {
  if (!value) {
    return (
      <Typography color="text.disabled" variant="caption">
        --
      </Typography>
    );
  }
  return (
    <Typography color="textSecondary" variant="caption">
      {numeric ? <Numeric>{value}</Numeric> : value}
    </Typography>
  );
}

/**
 * The three metadata columns as one line, for the narrow layout where they
 * leave the table.
 * @param hit - The hit.
 * @returns e.g. "ILLUMINA, Malawi, 2018-07-25", or "" when none is recorded.
 */
function describeMeta(hit: KmindexHit): string {
  return [
    hit.sra?.platform,
    hit.sra?.country,
    hit.sra?.release_date?.slice(0, 10),
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/**
 * An OpenVirome search filtered to one accession.
 *
 * The filter is a JSON array in the query string, so it is encoded as a whole
 * rather than pasted in raw the way logan-search.org does: brackets and quotes
 * are not safe in a query and an accession is no guarantee of tidy input.
 * @param field - Which OpenVirome filter the accession goes in.
 * @param accession - The run or BioProject accession.
 * @returns e.g. https://openvirome.com/?filters=%5B%22runId-SRR1197259%22%5D.
 */
export function openViromeUrl(
  field: OpenViromeField,
  accession: string
): string {
  const filters = JSON.stringify([`${field}-${accession}`]);
  return `${OPENVIROME_URL}?filters=${encodeURIComponent(filters)}`;
}

/**
 * A compact OpenVirome link to sit after an accession's NCBI link.
 *
 * "OV" is what logan-search.org prints, and spelling the name out on every
 * row would double the width of the accession column. The tooltip names it
 * for a sighted reader, keyboard included, and the hidden text names it for a
 * screen reader; describeChild keeps the tooltip from replacing that name.
 * @param props - Component props.
 * @param props.accession - The accession to search for.
 * @param props.field - Which OpenVirome filter the accession goes in.
 * @returns The link.
 */
function OpenViromeLink({
  accession,
  field,
}: {
  accession: string;
  field: OpenViromeField;
}): JSX.Element {
  return (
    <Tooltip describeChild title="Find this accession on OpenVirome">
      <Link
        href={openViromeUrl(field, accession)}
        rel="noopener noreferrer"
        target="_blank"
        underline="hover"
        variant="caption"
      >
        OV
        <Box component="span" sx={visuallyHidden}>
          {" "}
          ({accession} on OpenVirome, opens in a new tab)
        </Box>
      </Link>
    </Tooltip>
  );
}

/**
 * An NCBI link for a BioProject, BioSample or study accession, with an
 * OpenVirome link beside it where asked for, or the dimmed dash when the
 * mirror had none.
 * @param props - Component props.
 * @param props.href - Where the accession resolves at NCBI.
 * @param props.openVirome - OpenVirome filter for a second link beside the
 * NCBI one, for the accession kinds OpenVirome can filter on.
 * @param props.value - The accession, or null when not recorded.
 * @returns The link, or the dash.
 */
function MetaLink({
  href,
  openVirome,
  value,
}: {
  href: string;
  openVirome?: OpenViromeField;
  value?: string | null;
}): JSX.Element {
  if (!value) return <Meta value={value} />;
  return (
    <Typography variant="caption">
      <Link
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        underline="hover"
      >
        {value}
        <Box component="span" sx={visuallyHidden}>
          {" "}
          (opens NCBI in a new tab)
        </Box>
      </Link>
      {openVirome && (
        <>
          {" "}
          <OpenViromeLink accession={value} field={openVirome} />
        </>
      )}
    </Typography>
  );
}

/**
 * One mirror field's cell content for a hit.
 * @param key - Which field.
 * @param sra - The hit's mirror record, or null when the mirror had none.
 * @returns The cell content.
 */
function renderMetaValue(
  key: MetaColumnKey,
  sra: SraRunMetadata | null
): ReactNode {
  switch (key) {
    case "bioproject":
      return (
        <MetaLink
          href={`${BIOPROJECT_URL}${encodeURIComponent(sra?.bioproject ?? "")}`}
          openVirome="bioproject"
          value={sra?.bioproject}
        />
      );
    case "biosample":
      return (
        <MetaLink
          href={`${BIOSAMPLE_URL}${encodeURIComponent(sra?.biosample ?? "")}`}
          openVirome="biosample"
          value={sra?.biosample}
        />
      );
    case "study":
      // NCBI has no study landing page of its own; an SRA search on the
      // accession lists the study's runs, which is what the reader is after.
      return (
        <MetaLink
          href={`${SRA_RUN_URL}${encodeURIComponent(sra?.study ?? "")}`}
          value={sra?.study}
        />
      );
    case "mbases":
      return <Meta numeric value={sra?.mbases?.toLocaleString() ?? null} />;
    case "release_date":
      return <Meta numeric value={sra?.release_date?.slice(0, 10)} />;
    default:
      return <Meta value={sra?.[key]} />;
  }
}

/**
 * The button and menu that pick which mirror columns the table shows.
 * @param props - Component props.
 * @param props.onToggle - Called with a column to show or hide it.
 * @param props.visible - Columns currently shown.
 * @returns The chooser.
 */
function ColumnChooser({
  onToggle,
  visible,
}: {
  onToggle: (key: MetaColumnKey) => void;
  visible: MetaColumnKey[];
}): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <ColumnsButton
        aria-controls={anchor ? COLUMNS_MENU_ID : undefined}
        aria-expanded={Boolean(anchor)}
        aria-haspopup="menu"
        onClick={(event): void => setAnchor(event.currentTarget)}
        size="small"
        startIcon={<ViewColumn />}
      >
        Columns
      </ColumnsButton>
      <Menu
        anchorEl={anchor}
        id={COLUMNS_MENU_ID}
        onClose={(): void => setAnchor(null)}
        open={Boolean(anchor)}
      >
        {/* Stays open on a click: picking three columns should not take
            three trips to the button. */}
        {META_COLUMNS.map(({ key, label }) => {
          const checked = visible.includes(key);
          return (
            <MenuItem
              aria-checked={checked}
              dense
              key={key}
              onClick={(): void => onToggle(key)}
              role="menuitemcheckbox"
            >
              <Checkbox
                checked={checked}
                disableRipple
                edge="start"
                size="small"
                tabIndex={-1}
              />
              <ListItemText primary={label} />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

/**
 * The warning that part of the index could not be read.
 *
 * Shared by the listing and the empty state rather than living in the
 * listing: a search whose shards all failed matches nothing, and "no
 * accessions matched" on its own makes that a fact about the query.
 * @param props - Component props.
 * @param props.noun - What the failures left incomplete. The empty state has
 * no rows, so calling that a list points at something the reader cannot see.
 * @param props.results - Results payload, for the shard counts.
 * @returns The alert, or null when every shard answered.
 */
function ShardWarning({
  noun,
  results,
}: {
  noun: "list" | "search";
  results: KmindexResults;
}): JSX.Element | null {
  if (results.shards_failed <= 0) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {results.shards_failed} of {results.shards_searched} index shards could
      not be read, so this {noun} is incomplete. Come back in an hour and the
      missing shards are retried.
    </Alert>
  );
}

interface SortableHeaderProps {
  align?: "left" | "right";
  applied: KmindexSort;
  column: KmindexSortColumn;
  component?: ElementType;
  label: string;
  onSort: (column: KmindexSortColumn) => void;
  title?: string;
}

/**
 * A header cell that sorts its column, lit when it is the applied sort.
 * @param props - Component props.
 * @param props.align - Cell alignment, matching the body cells below it.
 * @param props.applied - Column and direction the response says it applied.
 * @param props.column - Column this header sorts.
 * @param props.component - Cell to render, for a column the narrow layout
 * hides. Defaults to a plain TableCell.
 * @param props.label - Header text.
 * @param props.onSort - Called with this column when the header is clicked.
 * @param props.title - Tooltip for the column, if it needs one.
 * @returns The header cell.
 */
function SortableHeader({
  align,
  applied,
  column,
  component: Cell = TableCell,
  label,
  onSort,
  title,
}: SortableHeaderProps): JSX.Element {
  const active = applied.column === column;
  return (
    <Cell
      align={align}
      sortDirection={active ? applied.order : false}
      title={title}
    >
      <TableSortLabel
        active={active}
        direction={active ? applied.order : defaultOrder(column)}
        onClick={(): void => onSort(column)}
      >
        {label}
      </TableSortLabel>
    </Cell>
  );
}

export const LoganSearchResults = ({
  search,
}: LoganSearchResultsProps): JSX.Element | null => {
  const { goToPage, isLoadingResults, results, setPageSize, setSort } = search;
  // Keyed on the job rather than a bare boolean: a disclosure opened over one
  // search stood open over the next one, explaining a cap that may not have
  // bitten and naming indexes that were not searched.
  const [whyOpenFor, setWhyOpenFor] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] =
    useState<MetaColumnKey[]>(DEFAULT_META_COLUMNS);

  if (!results) return null;

  // Filtered to nothing is the reader's filter, not the query: blaming the
  // threshold here would send them to change the wrong thing.
  if (results.filtered && results.total_hits === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <ShardWarning noun="search" results={results} />
        <Alert severity="info">
          No runs match these filters. Remove one above to widen the set.
        </Alert>
      </Box>
    );
  }

  if (results.total_hits === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <ShardWarning noun="search" results={results} />
        <Alert severity="info">
          No accessions matched at this threshold. Try lowering the minimum
          shared k-mer fraction, or searching a different index.
        </Alert>
      </Box>
    );
  }

  // Largest index first: the point of the breakdown is showing which index got
  // swamped by which, and selection order buries that.
  const perIndex = [...(results.per_index ?? [])].sort(
    (a, b) => b.hits_before_cap - a.hits_before_cap
  );
  // Gates the per-index content only. Index count says nothing about how the
  // scores are distributed, so it must not decide whether the tie-band caveat
  // is shown.
  const showPerIndex = perIndex.length > 1;
  // Only matchers get a line of their own. With 109 indexes and a query a
  // handful of them see, seven of the ten spelled-out lines would say the
  // index matched nothing, which explains the cap to nobody. Zero rows sort
  // last, so the lines are the head of the sorted list either way.
  const indexLines = Math.min(
    perIndex.filter((one) => one.hits_before_cap > 0).length,
    MAX_INDEX_LINES
  );
  const restNote = describeRestIndexes(perIndex.slice(indexLines));

  const whyOpen = whyOpenFor === results.job_id;

  // Filtered from the config rather than kept in click order, so a column
  // always lands in the same place however it was switched on.
  const metaColumns = META_COLUMNS.filter(({ key }) =>
    visibleColumns.includes(key)
  );
  const toggleColumn = (key: MetaColumnKey): void => {
    const hiding = visibleColumns.includes(key);
    // A table ordered by a column nobody can see has no lit header to explain
    // it, so hiding the sorted column goes back to score order.
    const column = META_COLUMNS.find((c) => c.key === key);
    if (hiding && column?.sort && column.sort === appliedSort(results).column)
      void setSort("score");
    setVisibleColumns((shown) =>
      shown.includes(key) ? shown.filter((k) => k !== key) : [...shown, key]
    );
  };

  // A backend predating the breakdown sends neither total_matches nor
  // per_index, so both need the same guard: an unguarded read of
  // total_matches throws inside render and unmounts the whole card, which is
  // worse than the count it was meant to show being missing.
  const totalMatches = results.total_matches ?? results.total_hits;
  const notListed = Math.max(totalMatches - results.total_hits, 0);
  // While truncated the listing is exactly the cap, so total_hits names it.
  const cap = results.total_hits;

  // The toolbar names the window the table shows, and only the window: the
  // match count is the summary strip's line, directly above. It stays true
  // under any sort, because the cap is applied on score before the listing is
  // re-sorted, so the listed rows are the highest-coverage ones however they
  // are ordered on screen.
  let listWindow = results.filtered
    ? `All ${results.total_hits.toLocaleString()} runs that match these filters`
    : `All ${results.total_hits.toLocaleString()} hits`;
  let capNote: string | null = null;
  if (results.truncated) {
    listWindow = `Listing the ${cap.toLocaleString()} highest-coverage hits`;
    // notListed is 0 only when the match count went missing; "the remaining 0"
    // would be a worse answer than naming the cap and leaving it there.
    capNote =
      notListed > 0
        ? `The remaining ${notListed.toLocaleString()} cannot be paged to.`
        : `More accessions matched than can be listed.`;
  }

  // What the response says it did, not what was clicked: a metadata sort the
  // mirror could not answer comes back as score order, and the lit header has
  // to show that rather than the column the reader asked for.
  const applied = appliedSort(results);
  // Likewise the served page size, so the page arithmetic agrees with the rows
  // on screen even before a size change has round-tripped.
  const pageSize = results.limit;

  // The same pager top and bottom: a reader who has come down a page of rows
  // should not have to go back up to move to the next one.
  const paginationProps = {
    component: "div" as const,
    count: results.total_hits,
    labelDisplayedRows: ({
      count,
      from,
      to,
    }: {
      count: number;
      from: number;
      to: number;
    }): string =>
      `${from.toLocaleString()}-${to.toLocaleString()} of ${count.toLocaleString()}`,
    onPageChange: async (_: unknown, page: number): Promise<void> => {
      await goToPage(page * pageSize);
    },
    onRowsPerPageChange: async (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): Promise<void> => {
      await setPageSize(Number(event.target.value));
    },
    page: Math.floor(results.offset / pageSize),
    rowsPerPage: pageSize,
    rowsPerPageOptions: [...PAGE_SIZE_OPTIONS],
    // The caption is a range of row numbers, so it wants the same tabular
    // figures the columns do.
    sx: { fontVariantNumeric: "tabular-nums" },
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <ShardWarning noun="list" results={results} />
        <ResultsToolbar>
          <div>
            <Typography component="h2" variant="subtitle1">
              {listWindow}
            </Typography>
            {capNote && (
              <Typography color="textSecondary" variant="body2">
                {capNote}{" "}
                <Button
                  aria-controls={WHY_ID}
                  aria-expanded={whyOpen}
                  onClick={(): void =>
                    setWhyOpenFor(whyOpen ? null : results.job_id)
                  }
                  size="small"
                  sx={{ minWidth: 0, p: 0, verticalAlign: "baseline" }}
                >
                  {whyOpen ? "Hide why" : "Why?"}
                </Button>
              </Typography>
            )}
          </div>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <ColumnChooser onToggle={toggleColumn} visible={visibleColumns} />
            <TablePagination {...paginationProps} />
          </Box>
        </ResultsToolbar>

        {results.truncated && (
          /* The id sits on a wrapper that is always in the document rather
             than on the Collapse, which unmountOnExit takes away: an
             aria-controls pointing at nothing is dangling for precisely the
             time the button is worth pressing. */
          <div id={WHY_ID}>
            <Collapse in={whyOpen} unmountOnExit>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Raising the threshold shrinks the underlying match count, but
                  it does not re-rank what you see: the same accessions come
                  back in the same order until the threshold rises above the
                  lowest score listed here. A conserved query can match hundreds
                  of thousands of runs at a perfect k-mer score, so it may not
                  clear the cap at all.
                </Typography>
                {showPerIndex && (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      The cap is one score sort across every index, applied
                      after the shards merge, so each index keeps only what
                      ranked highest overall, so an index with few matches can
                      keep none of them.
                    </Typography>
                    {perIndex.slice(0, indexLines).map((summary) => (
                      <Typography
                        component="div"
                        key={summary.index}
                        variant="body2"
                        sx={{ mt: 0.5 }}
                      >
                        {summary.index}: {describeIndexShare(summary, cap)}
                      </Typography>
                    ))}
                    {restNote && (
                      <Typography
                        component="div"
                        variant="body2"
                        sx={{ mt: 0.5 }}
                      >
                        {restNote}
                      </Typography>
                    )}
                  </>
                )}
                {/* Unconditional: how wide the tie band is depends on the
                    query, not on how many indexes were searched, and the
                    backend sends nothing that measures it. Two indexes over
                    16S and eight over the same put all 50,000 listed rows on
                    one score; one index over a viral spike gave 87 distinct
                    scores. */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Scores repeat: the score is a fraction of your query&apos;s
                  k-mers, so ties are common and a conserved query can put every
                  row listed here on a single one. Where the cut falls inside a
                  tie, a stable hash of the accession decides which
                  equally-scoring runs made the list: arbitrary, but the same on
                  every reload.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  A longer query is not a more specific one: kmindex scores the
                  fraction of your query&apos;s k-mers a run shares, so
                  extending into conserved flanking sequence raises that
                  fraction in unrelated runs too. A 4x longer version of the
                  same 18S query matched more runs here, not fewer. The match
                  set responds to how rare your k-mers are and to the threshold
                  above, not to query length.
                </Typography>
              </Alert>
            </Collapse>
          </div>
        )}

        {/* Paging and sorting refetch, and the status card that used to
            carry this is gone once there are results to show. */}
        {isLoadingResults && <LinearProgress sx={{ mb: 1 }} />}

        <TableContainer aria-busy={isLoadingResults}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <SortableHeader
                  applied={applied}
                  column="accession"
                  label="Accession"
                  onSort={setSort}
                  title="Opens the run at NCBI SRA in a new tab"
                />
                <SortableHeader
                  align="right"
                  applied={applied}
                  column="score"
                  label="k-mer coverage"
                  onSort={setSort}
                  title="Fraction of the query's 31-mers found in the run, after subtracting a false-positive baseline for the 227 saturated samples Logan flags"
                />
                {/* ANI is monotone in the score, so sorting the coverage
                    column sorts this one too and a second control would only
                    be a second name for it. */}
                <MetaCell
                  align="right"
                  title="Average nucleotide identity estimated from k-mer coverage, coverage^(1/31), as on logan-search.org"
                >
                  ANI est.
                </MetaCell>
                <SortableHeader
                  applied={applied}
                  column="organism"
                  label="Organism"
                  onSort={setSort}
                />
                {metaColumns.map(({ key, label, sort }) =>
                  sort ? (
                    <SortableHeader
                      applied={applied}
                      column={sort}
                      component={MetaCell}
                      key={key}
                      label={label}
                      onSort={setSort}
                    />
                  ) : (
                    <MetaCell
                      align={key === "mbases" ? "right" : undefined}
                      key={key}
                    >
                      {label}
                    </MetaCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {results.hits.map((hit) => (
                <TableRow key={`${hit.shard}:${hit.accession}`}>
                  <TableCell>
                    {/* No per-row icon: twenty-five of them is chrome. The
                        destination is named for a screen reader instead. */}
                    <Link
                      href={`${SRA_RUN_URL}${hit.accession}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      underline="hover"
                    >
                      {hit.accession}
                      <Box component="span" sx={visuallyHidden}>
                        {" "}
                        (opens NCBI SRA in a new tab)
                      </Box>
                    </Link>{" "}
                    <OpenViromeLink accession={hit.accession} field="runId" />
                  </TableCell>
                  <TableCell align="right">
                    <CoverageCell>
                      {/* Ahead of the rail rather than after the number: a
                          chip on the end of the cell pushes the rail and the
                          digits left, out of column with every row that
                          carries no chip. */}
                      {hit.fp_correction != null && (
                        <Tooltip describeChild title={describeCorrection(hit)}>
                          {/* The tooltip is the only place the raw kmindex
                              ratio is stated, and a Chip with no onClick
                              renders a div, which nothing but a pointer can
                              reach. describeChild keeps the sentence a
                              description, but MUI writes it back as a native
                              title while the tooltip is closed, and a
                              role-less div takes its name from that title --
                              so the visible word has to be pinned as the
                              name. */}
                          <Chip
                            aria-label="corrected"
                            label="corrected"
                            size="small"
                            tabIndex={0}
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                      {/* Decoration for the number beside it: the rail
                          carries the shape of the fall-off down a page, the
                          digits carry the value. */}
                      <CoverageRail aria-hidden>
                        <span
                          style={{
                            width: `${Math.round(Math.min(Math.max(hit.score, 0), 1) * 100)}%`,
                          }}
                        />
                      </CoverageRail>
                      <Numeric>{hit.score.toFixed(4)}</Numeric>
                    </CoverageCell>
                  </TableCell>
                  <MetaCell align="right">
                    <Numeric>
                      {hit.ani == null ? "--" : hit.ani.toFixed(4)}
                    </Numeric>
                  </MetaCell>
                  <TableCell>
                    {hit.sra?.organism ? (
                      <Typography variant="body2">
                        {hit.sra.organism}
                      </Typography>
                    ) : (
                      <Typography color="textSecondary" variant="caption">
                        {hit.shard}
                      </Typography>
                    )}
                    {/* Only when the mirror had something: an empty caption
                        still takes a line box under every organism. */}
                    {describeMeta(hit) && (
                      <OrganismMeta>
                        <Typography color="textSecondary" variant="caption">
                          {describeMeta(hit)}
                        </Typography>
                      </OrganismMeta>
                    )}
                  </TableCell>
                  {metaColumns.map(({ key }) => (
                    <MetaCell
                      align={key === "mbases" ? "right" : undefined}
                      key={key}
                    >
                      {renderMetaValue(key, hit.sra)}
                    </MetaCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Only when the mirror missed something: a line reading 25 of 25 on
            every page is a diagnostic nobody needs to read. */}
        {results.sra_mirror_available &&
          results.sra_annotated < results.hits.length && (
            // A Tooltip rather than a title attribute, and tabbable so it
            // opens: what the mirror covers is the difference between this
            // line being a bug report and being a fact about a run's age, and
            // a title reaches nobody who is not holding a mouse.
            <Tooltip describeChild title={MIRROR_SCOPE_NOTE}>
              <Typography
                color="textSecondary"
                component="div"
                sx={{ mt: 1 }}
                tabIndex={0}
                variant="caption"
              >
                Metadata found for {results.sra_annotated} of{" "}
                {results.hits.length} rows on this page.
              </Typography>
            </Tooltip>
          )}

        <TablePagination {...paginationProps} />
      </CardContent>
    </Card>
  );
};
