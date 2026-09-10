import { ResultsToolbar } from "@brc/components/LoganSearch/loganSearch.styles";
import { OpenInNew } from "@mui/icons-material";
import {
  Alert,
  Card,
  CardContent,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  appliedSort,
  defaultOrder,
  type KmindexHit,
  type KmindexIndexSummary,
  type KmindexSort,
  type KmindexSortColumn,
  PAGE_SIZE_OPTIONS,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface LoganSearchResultsProps {
  search: ReturnType<typeof useKmindexSearch>;
}

const SRA_RUN_URL = "https://www.ncbi.nlm.nih.gov/sra/?term=";

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
  if (kept === 0) return `${total} matched, none listed -- ${alone}`;
  return `${listed} of ${total} listed -- ${alone}`;
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
    `k-mers, so that baseline is subtracted -- as logan-search.org does.`
  );
}

interface SortableHeaderProps {
  align?: "left" | "right";
  applied: KmindexSort;
  column: KmindexSortColumn;
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
 * @param props.label - Header text.
 * @param props.onSort - Called with this column when the header is clicked.
 * @param props.title - Tooltip for the column, if it needs one.
 * @returns The header cell.
 */
function SortableHeader({
  align,
  applied,
  column,
  label,
  onSort,
  title,
}: SortableHeaderProps): JSX.Element {
  const active = applied.column === column;
  return (
    <TableCell
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
    </TableCell>
  );
}

export const LoganSearchResults = ({
  search,
}: LoganSearchResultsProps): JSX.Element | null => {
  const { goToPage, results, setPageSize, setSort } = search;

  if (!results) return null;

  if (results.total_hits === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No accessions matched at this threshold. Try lowering the minimum shared
        k-mer fraction, or searching a different index.
      </Alert>
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

  // A backend predating the breakdown sends neither total_matches nor
  // per_index, so both need the same guard: an unguarded read of
  // total_matches throws inside render and unmounts the whole card, which is
  // worse than the count it was meant to show being missing.
  const totalMatches = results.total_matches ?? results.total_hits;
  const notListed = Math.max(totalMatches - results.total_hits, 0);
  // While truncated the listing is exactly the cap, so total_hits names it.
  const cap = results.total_hits;

  let headline = `${results.total_hits.toLocaleString()} SRA accessions`;
  let capNote: string | null = null;
  if (results.truncated) {
    // notListed is 0 only when the match count went missing; "the remaining 0"
    // would be a worse answer than naming the cap and leaving it there.
    headline =
      notListed > 0
        ? `${totalMatches.toLocaleString()} SRA accessions matched`
        : `${cap.toLocaleString()} SRA accessions listed`;
    capNote =
      notListed > 0
        ? `Listing the ${cap.toLocaleString()} highest-scoring -- the remaining ${notListed.toLocaleString()} cannot be paged to.`
        : `Capped at ${cap.toLocaleString()} -- more accessions matched than can be listed.`;
  }

  // What the response says it did, not what was clicked: a metadata sort the
  // mirror could not answer comes back as score order, and the lit header has
  // to show that rather than the column the reader asked for.
  const applied = appliedSort(results);
  // Likewise the served page size, so the page arithmetic agrees with the rows
  // on screen even before a size change has round-tripped.
  const pageSize = results.limit;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        {results.shards_failed > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {results.shards_failed} of {results.shards_searched} index shards
            could not be read, so this list is incomplete. Reload to retry.
          </Alert>
        )}
        <ResultsToolbar>
          <div>
            <Typography variant="h6">{headline}</Typography>
            {capNote && (
              <Typography color="textSecondary" variant="body2">
                {capNote}
              </Typography>
            )}
            {!results.truncated && showPerIndex && (
              <Typography color="textSecondary" component="div" variant="body2">
                {perIndex
                  .map(
                    (summary) =>
                      `${summary.index} ${summary.hits_before_cap.toLocaleString()}`
                  )
                  .join(" · ")}
              </Typography>
            )}
          </div>
          <div>
            <Chip
              label={`${results.shards_with_hits}/${results.shards_searched} shards`}
              size="small"
              sx={{ mr: 1 }}
            />
            {results.sra_mirror_available && (
              <Chip
                label={`SRA mirror: ${results.sra_annotated}/${results.hits.length} on this page`}
                size="small"
                title={MIRROR_SCOPE_NOTE}
              />
            )}
          </div>
        </ResultsToolbar>

        {results.truncated && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Raising the threshold shrinks the underlying match count, but it
              does not re-rank what you see: the same accessions come back in
              the same order until the threshold rises above the lowest score
              listed here. A conserved query can match hundreds of thousands of
              runs at a perfect k-mer score, so it may not clear the cap at all.
            </Typography>
            {showPerIndex && (
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  The cap is one score sort across every index, applied after
                  the shards merge, so each index keeps only what ranked highest
                  overall -- an index with few matches can keep none of them.
                </Typography>
                {perIndex.map((summary) => (
                  <Typography
                    component="div"
                    key={summary.index}
                    variant="body2"
                    sx={{ mt: 0.5 }}
                  >
                    {summary.index}: {describeIndexShare(summary, cap)}
                  </Typography>
                ))}
              </>
            )}
            {/* Unconditional: how wide the tie band is depends on the query,
                not on how many indexes were searched, and the backend sends
                nothing that measures it. Two indexes over 16S and eight over
                the same put all 50,000 listed rows on one score; one index
                over a viral spike gave 87 distinct scores. */}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Scores repeat: the score is a fraction of your query&apos;s
              k-mers, so ties are common and a conserved query can put every row
              listed here on a single one. Where the cut falls inside a tie, a
              stable hash of the accession decides which equally-scoring runs
              made the list -- arbitrary, but the same on every reload.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              A longer query is not a more specific one: kmindex scores the
              fraction of your query&apos;s k-mers a run shares, so extending
              into conserved flanking sequence raises that fraction in unrelated
              runs too -- a 4x longer version of the same 18S query matched more
              runs here, not fewer. The match set responds to how rare your
              k-mers are and to the threshold above, not to query length.
            </Typography>
          </Alert>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <SortableHeader
                applied={applied}
                column="accession"
                label="Accession"
                onSort={setSort}
              />
              <SortableHeader
                align="right"
                applied={applied}
                column="score"
                label="k-mer coverage"
                onSort={setSort}
                title="Fraction of the query's 31-mers found in the run, after subtracting a false-positive baseline for the 227 saturated samples Logan flags"
              />
              {/* ANI is monotone in the score, so sorting the coverage column
                  sorts this one too and a second control would only be a
                  second name for it. */}
              <TableCell
                align="right"
                title="Average nucleotide identity estimated from k-mer coverage, coverage^(1/31), as on logan-search.org"
              >
                ANI est.
              </TableCell>
              <SortableHeader
                applied={applied}
                column="organism"
                label="Organism"
                onSort={setSort}
              />
              <SortableHeader
                applied={applied}
                column="platform"
                label="Platform"
                onSort={setSort}
              />
              <SortableHeader
                applied={applied}
                column="country"
                label="Country"
                onSort={setSort}
              />
              <SortableHeader
                applied={applied}
                column="release_date"
                label="Released"
                onSort={setSort}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {results.hits.map((hit) => (
              <TableRow key={`${hit.shard}:${hit.accession}`}>
                <TableCell>
                  <Link
                    href={`${SRA_RUN_URL}${hit.accession}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    sx={{
                      alignItems: "center",
                      display: "inline-flex",
                      gap: 0.5,
                    }}
                  >
                    {hit.accession}
                    <OpenInNew fontSize="inherit" />
                  </Link>
                </TableCell>
                <TableCell align="right">
                  {hit.score.toFixed(4)}
                  {hit.fp_correction != null && (
                    <Tooltip title={describeCorrection(hit)}>
                      {/* The tooltip is the only place the raw kmindex ratio
                          is stated, and a Chip with no onClick renders a div,
                          which nothing but a pointer can reach. */}
                      <Chip
                        label="corrected"
                        size="small"
                        sx={{ ml: 1 }}
                        tabIndex={0}
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right">
                  {hit.ani == null ? "--" : hit.ani.toFixed(4)}
                </TableCell>
                <TableCell>
                  {hit.sra?.organism ? (
                    <Typography variant="body2">{hit.sra.organism}</Typography>
                  ) : (
                    <Typography color="textSecondary" variant="caption">
                      {hit.shard}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="caption">
                    {hit.sra?.platform ?? "--"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="caption">
                    {hit.sra?.country ?? "--"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="textSecondary" variant="caption">
                    {hit.sra?.release_date?.slice(0, 10) ?? "--"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={results.total_hits}
          onPageChange={async (_, page): Promise<void> => {
            await goToPage(page * pageSize);
          }}
          onRowsPerPageChange={async (event): Promise<void> => {
            await setPageSize(Number(event.target.value));
          }}
          page={Math.floor(results.offset / pageSize)}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
        />
      </CardContent>
    </Card>
  );
};
