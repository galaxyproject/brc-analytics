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
  Typography,
} from "@mui/material";
import {
  PAGE_SIZE,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface LoganSearchResultsProps {
  search: ReturnType<typeof useKmindexSearch>;
}

const SRA_RUN_URL = "https://www.ncbi.nlm.nih.gov/sra/?term=";

export const LoganSearchResults = ({
  search,
}: LoganSearchResultsProps): JSX.Element | null => {
  const { goToPage, results } = search;

  if (!results) return null;

  if (results.total_hits === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No accessions matched at this threshold. Try lowering the minimum shared
        k-mer fraction, or searching a different index.
      </Alert>
    );
  }

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
          <Typography variant="h6">
            {results.total_hits.toLocaleString()} SRA accessions
          </Typography>
          <div>
            <Chip
              label={`${results.shards_with_hits}/${results.shards_searched} shards`}
              size="small"
              sx={{ mr: 1 }}
            />
            {results.sra_mirror_available && (
              <Chip
                label={`${results.sra_annotated}/${results.hits.length} in SRA mirror`}
                size="small"
                sx={{ mr: 1 }}
                title="Logan indexes all of SRA; the mirror covers BRC-relevant organisms, so hits outside that scope have no metadata"
              />
            )}
            {results.truncated && (
              <Chip
                color="warning"
                label="Capped at 50,000"
                size="small"
                title="Raise the threshold to narrow the result set"
              />
            )}
          </div>
        </ResultsToolbar>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Accession</TableCell>
              <TableCell align="right">Shared k-mers</TableCell>
              <TableCell>Organism</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Released</TableCell>
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
                <TableCell align="right">{hit.score.toFixed(4)}</TableCell>
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
            await goToPage(page * PAGE_SIZE);
          }}
          onRowsPerPageChange={undefined}
          page={Math.floor(results.offset / PAGE_SIZE)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </CardContent>
    </Card>
  );
};
