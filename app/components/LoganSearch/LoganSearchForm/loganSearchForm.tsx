import { Search } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useMemo, useState } from "react";
import { useKmindexSearch } from "../../../hooks/useKmindexSearch";
import { ControlRow, FieldRow, SearchContainer } from "../loganSearch.styles";
import { countBases, groupIndexes, toIndexName } from "../utils";

interface LoganSearchFormProps {
  search: ReturnType<typeof useKmindexSearch>;
}

// Logan-Search caps queries at 2.5 kb; k-mer recall degrades past that and the
// index is built for gene-sized queries, not whole genomes.
const MAX_QUERY_BASES = 2500;

// Environmental metagenomes are the most generally interesting starting point,
// but fall back to whatever the instance actually has registered.
const DEFAULT_STRATEGY = "METAGENOMIC";
const DEFAULT_DIVISION = "ENV";

/**
 * Resolve a select's value to something present in its options.
 * @param picked - Value the user chose, or "" when they haven't chosen yet.
 * @param preferred - Value to use when the user hasn't chosen.
 * @param options - Values currently available.
 * @returns A value guaranteed to be in options, or "" when there are none.
 */
function pickBy(picked: string, preferred: string, options: string[]): string {
  if (picked && options.includes(picked)) return picked;
  if (options.includes(preferred)) return preferred;
  return options[0] ?? "";
}

const SAMPLE_QUERY = `>example_query
ATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAACGGTAACAGGAAGAAGCTTGCTTCTTTGCTGACGAGTGGCGGACGGGTGAGTAATGTCTGGG
AAACTGCCTGATGGAGGGGGATAACTACTGGAAACGGTAGCTAATACCGCATAACGTCGCAAGACCAAAGAGGGGGACCTTCGGGCCTCTTGCCATCGGAT`;

export const LoganSearchForm = ({
  search,
}: LoganSearchFormProps): JSX.Element => {
  const [sequence, setSequence] = useState(SAMPLE_QUERY);
  const [pickedStrategy, setStrategy] = useState("");
  const [pickedDivision, setDivision] = useState("");
  const [threshold, setThreshold] = useState(0.3);

  const { byStrategy, strategies } = useMemo(
    () => groupIndexes(search.indexes),
    [search.indexes]
  );

  // Derive the selection rather than seeding state with a default, so the
  // value is always one MUI can find among the options -- the index list
  // arrives asynchronously and an unknown value logs an out-of-range warning.
  const strategy = pickBy(pickedStrategy, DEFAULT_STRATEGY, strategies);
  const divisions = byStrategy.get(strategy) ?? [];
  const division = pickBy(pickedDivision, DEFAULT_DIVISION, divisions);
  const index = toIndexName(strategy, division);
  const bases = countBases(sequence);
  const tooLong = bases > MAX_QUERY_BASES;
  // An errored job keeps its jobId with no results forever, so leaving the
  // error out of this leaves the form stuck "running" with no way back.
  const isRunning =
    search.isSubmitting ||
    Boolean(search.jobId && !search.results && !search.error);

  const canSubmit =
    Boolean(index) &&
    bases > 0 &&
    !tooLong &&
    !isRunning &&
    !search.isLoadingIndexes;

  const handleStrategyChange = (value: string): void => {
    setStrategy(value);
    // Divisions differ per strategy, so drop the current one if the new
    // strategy doesn't carry it and let the derivation pick a fallback.
    const available = byStrategy.get(value) ?? [];
    if (!available.includes(division)) setDivision("");
  };

  return (
    <Card>
      <CardContent>
        <SearchContainer>
          <Typography variant="h6">Query sequence</Typography>
          <TextField
            error={tooLong}
            fullWidth
            helperText={
              tooLong
                ? `${bases} bases -- queries are capped at ${MAX_QUERY_BASES}`
                : `${bases} bases. FASTA; headers are ignored.`
            }
            maxRows={14}
            minRows={6}
            multiline
            onChange={(e): void => setSequence(e.target.value)}
            slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
            value={sequence}
          />

          <Typography variant="h6">Index</Typography>
          {search.isLoadingIndexes ? (
            <ControlRow>
              <CircularProgress size={20} />
              <Typography color="textSecondary" variant="body2">
                Loading available indexes...
              </Typography>
            </ControlRow>
          ) : (
            <FieldRow>
              <TextField
                fullWidth
                helperText="Library strategy"
                label="Strategy"
                onChange={(e): void => handleStrategyChange(e.target.value)}
                select
                value={strategy}
              >
                {strategies.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                helperText="Taxonomic division"
                label="Division"
                onChange={(e): void => setDivision(e.target.value)}
                select
                value={division}
              >
                {divisions.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </FieldRow>
          )}

          <div>
            <Typography gutterBottom variant="body2">
              Minimum shared k-mer fraction: {threshold.toFixed(2)}
            </Typography>
            <Slider
              max={1}
              min={0}
              onChange={(_, value): void => setThreshold(value as number)}
              step={0.05}
              sx={{ maxWidth: 400 }}
              value={threshold}
              valueLabelDisplay="auto"
            />
            <Typography color="textSecondary" variant="caption">
              Lower values return more accessions and take longer to aggregate.
            </Typography>
          </div>

          <ControlRow>
            <Button
              disabled={!canSubmit}
              onClick={async (): Promise<void> => {
                await search.submit({ index, sequence, threshold, zvalue: 6 });
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
            <Button onClick={search.reset} variant="outlined">
              Reset
            </Button>
            {index && (
              <Typography color="textSecondary" variant="body2">
                Searching {index}
              </Typography>
            )}
          </ControlRow>
        </SearchContainer>
      </CardContent>
    </Card>
  );
};
