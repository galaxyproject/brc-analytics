import {
  ControlRow,
  FormColumn,
  FormGrid,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { ConnectGalaxyAccount } from "@brc/components/LoganSearch/LoganSearchForm/components/ConnectGalaxyAccount/connectGalaxyAccount";
import {
  countBases,
  indexStrategy,
  sortIndexes,
} from "@brc/components/LoganSearch/utils";
import { Search } from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX, type ReactNode, useMemo, useState } from "react";

interface LoganSearchFormProps {
  search: ReturnType<typeof useKmindexSearch>;
}

// Logan-Search caps queries at 2.5 kb; k-mer recall degrades past that and the
// index is built for gene-sized queries, not whole genomes.
const MAX_QUERY_BASES = 2500;

// Mirrors MAX_INDEXES in the backend's galaxy models. The tool itself accepts
// any combination of the ~109 indexes; the ceiling is our shard download path,
// since each index fans out to dozens of datasets we pull individually.
const MAX_INDEXES = 8;

// Paired with SAMPLE_QUERY below: this is the division P. falciparum sits in,
// and it carries all but a handful of that query's hits. Fall back to whatever
// the instance actually has registered.
const DEFAULT_INDEX = "GENOMIC_INV";

// A 500 bp window of the P. falciparum 18S rRNA (GenBank M19172.1). Measured
// against DEFAULT_INDEX at threshold 0.5 it returns 17,629 hits -- 706 pages at
// 25 a page, where the bacterial 16S fragment that used to sit here returned
// 31,405 against METAGENOMIC_ENV. Neither truncates; the old pair was a worse
// first run, not a truncated one. What the swap really buys is a coherent pair:
// a Plasmodium query against the division Plasmodium sits in, rather than
// against environmental metagenomes.
const SAMPLE_QUERY = `>Plasmodium_falciparum_18S
GCGTATATTAAAATTGTTGCAGTTAAAACGCTCGTAGTTGAATTTCAAAGAATCGATATTTTATTGTAAC
TATTCTAGGGGAACTATTTTAGCTTTTGGCTTTAATACGCTTCCTCTATTATTATGTTCTTTAAATAACA
AAGATTCTTTTTAAAATCCCCACTTTTGCTTTTGCTTTTTTGGGGATTTTGTTACTTTGAGTAAATTAGA
GTGTTCAAAGCAAACAGTTAAAGCATTTACTGTGTTTGAATACTATAGCATGGAATAACAAAATTGAACA
AGCTAAAATTTTTTGTTCTTTTTTCTTATTTTGGCTTAGTTACGATTAATAGGAGTAGCTTGGGGACATT
CGTATTCAGATGTCAGAGGTGAAATTCTTAGATTTTCTGGAGACGAACAACTGCGAAAGCATTTGTCTAA
AATACTTCCATTAATCAAGAACGAAAGTTAAGGGAGTGAAGACGATCAGATACCGTCGTAATCTTAACCA
TAAACTATGC`;

export const LoganSearchForm = ({
  search,
}: LoganSearchFormProps): JSX.Element => {
  const [sequence, setSequence] = useState(SAMPLE_QUERY);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [threshold, setThreshold] = useState(0.5);

  const options = useMemo(() => sortIndexes(search.indexes), [search.indexes]);

  // Derive rather than seed state with a default: the index list arrives
  // asynchronously, and a value MUI can't find among its options warns.
  const indexes =
    picked ??
    (options.includes(DEFAULT_INDEX) ? [DEFAULT_INDEX] : options.slice(0, 1));

  const bases = countBases(sequence);
  const tooLong = bases > MAX_QUERY_BASES;
  const tooMany = indexes.length > MAX_INDEXES;
  // An errored job keeps its jobId with no results forever, so leaving the
  // error out of this leaves the form stuck "running" with no way back.
  const isRunning =
    search.isSubmitting ||
    Boolean(search.jobId && !search.results && !search.error);

  const canSubmit =
    indexes.length > 0 &&
    !tooMany &&
    bases > 0 &&
    !tooLong &&
    !isRunning &&
    !search.isLoadingIndexes;

  return (
    <Card>
      <CardContent>
        <ConnectGalaxyAccount />
        <FormGrid>
          <FormColumn>
            <Typography variant="h6">Query sequence</Typography>
            <TextField
              error={tooLong}
              fullWidth
              helperText={
                tooLong
                  ? `${bases} bases -- queries are capped at ${MAX_QUERY_BASES}`
                  : `${bases} bases. FASTA; headers are ignored.`
              }
              maxRows={20}
              minRows={8}
              multiline
              onChange={(e): void => setSequence(e.target.value)}
              slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
              value={sequence}
            />
          </FormColumn>

          <FormColumn>
            <Typography variant="h6">Indexes</Typography>
            {search.isLoadingIndexes ? (
              <ControlRow>
                <CircularProgress size={20} />
                <Typography color="textSecondary" variant="body2">
                  Loading available indexes...
                </Typography>
              </ControlRow>
            ) : (
              <Autocomplete
                disableCloseOnSelect
                getOptionLabel={(option): string => option}
                groupBy={indexStrategy}
                multiple
                onChange={(_, value): void => setPicked(value)}
                options={options}
                renderInput={(params): JSX.Element => (
                  <TextField
                    {...params}
                    error={tooMany}
                    helperText={
                      tooMany
                        ? `${indexes.length} selected -- at most ${MAX_INDEXES} per query`
                        : `${indexes.length} of ${options.length} selected. One job searches them all.`
                    }
                    label="kmindex indexes"
                    placeholder={indexes.length ? "" : "Add an index"}
                  />
                )}
                renderValue={(value, getItemProps): ReactNode =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getItemProps({ index })}
                      key={option}
                    />
                  ))
                }
                value={indexes}
              />
            )}

            <div>
              <Typography gutterBottom variant="body2">
                Minimum shared k-mer fraction: {threshold.toFixed(2)}
              </Typography>
              <Slider
                max={1}
                // Logan-Search itself clamps here: below a quarter of the query's
                // k-mers the hit list is mostly noise and very expensive to merge.
                min={0.25}
                onChange={(_, value): void => setThreshold(value as number)}
                step={0.05}
                value={threshold}
                valueLabelDisplay="auto"
              />
              <Typography color="textSecondary" variant="caption">
                Lower values return more accessions and take longer to
                aggregate.
              </Typography>
            </div>

            <ControlRow>
              <Button
                disabled={!canSubmit}
                onClick={async (): Promise<void> => {
                  await search.submit({
                    indexes,
                    sequence,
                    threshold,
                    zvalue: 6,
                  });
                }}
                startIcon={
                  isRunning ? <CircularProgress size={18} /> : <Search />
                }
                variant="contained"
              >
                {isRunning ? "Searching..." : "Search Logan"}
              </Button>
              {/* Never disabled -- Reset is the escape hatch when a search is
                  wedged, which is exactly when it would be disabled otherwise. */}
              <Button
                onClick={(): void => {
                  setPicked(null);
                  search.reset();
                }}
                variant="outlined"
              >
                Reset
              </Button>
            </ControlRow>
          </FormColumn>
        </FormGrid>
      </CardContent>
    </Card>
  );
};
