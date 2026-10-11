import { InfoOutlined, Search, UploadFile } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ControlRow,
  FormColumn,
  FormGrid,
  FormSpan,
  IndexChips,
  IndexHeading,
} from "@repo/shared/components/LoganSearch/loganSearch.styles";
import { ConnectGalaxyAccount } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/ConnectGalaxyAccount/connectGalaxyAccount";
import { IndexPicker } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexPicker";
import { IndexSummary } from "@repo/shared/components/LoganSearch/LoganSearchForm/components/IndexPicker/indexSummary";
import {
  LOGAN_EXAMPLES,
  type LoganExample,
} from "@repo/shared/components/LoganSearch/LoganSearchForm/examples";
import {
  queryNameOf,
  type RecentSearch,
} from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import {
  describeIndexSet,
  parseQuery,
  selectIndexes,
  sortIndexes,
} from "@repo/shared/components/LoganSearch/utils";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type ChangeEvent, type JSX, useMemo, useState } from "react";

interface LoganSearchFormProps {
  // Called once Galaxy has accepted a search, with what the history list
  // keeps of it.
  onSubmitted?: (search: RecentSearch) => void;
  search: ReturnType<typeof useKmindexSearch>;
}

// The index is built for gene-sized queries, not whole genomes. Keep in step
// with the backend's MAX_QUERY_BASES.
const MAX_QUERY_BASES = 5000;

// A query file is read into the textarea and validated there, so the only
// reason to refuse one up front is the browser: a genome picked by mistake
// would be hundreds of megabytes of text in a textarea. A megabyte is still
// far past anything the 5,000-base cap would let through.
const MAX_QUERY_FILE_BYTES = 1024 * 1024;
const QUERY_FILE_TYPES = ".fa,.fasta,.fna,.fq,.fastq,.txt";

// Paired with SAMPLE_QUERY below: this is the division P. falciparum sits in,
// and it carries all but a handful of that query's hits. Fall back to whatever
// the instance actually has registered.
const DEFAULT_INDEX = "GENOMIC_INV";

// The first example: a 500 bp window of the P. falciparum 18S rRNA. Measured
// against DEFAULT_INDEX at threshold 0.5 it returns 17,629 hits -- 706 pages
// at 25 a page, where the bacterial 16S fragment that used to sit here
// returned 31,405 against METAGENOMIC_ENV. Neither truncates; the old pair was
// a worse first run, not a truncated one. What the swap really buys is a
// coherent pair: a Plasmodium query against the division Plasmodium sits in,
// rather than against environmental metagenomes.
const SAMPLE_QUERY = LOGAN_EXAMPLES[0].sequence;

// Shown on Custom while the default stands, so a lone highlighted index reads
// as a choice the page made, not one somebody forgot about.
const DEFAULT_NOTE =
  "Starts on invertebrate genomic, where the sample query's hits are.";

export const LoganSearchForm = ({
  onSubmitted,
  search,
}: LoganSearchFormProps): JSX.Element => {
  const [sequence, setSequence] = useState(SAMPLE_QUERY);
  // Index names. null means "not touched": the default is derived from the
  // loaded list rather than seeded, because the list arrives asynchronously
  // and a default the instance lacks would select nothing. What it falls back
  // to when DEFAULT_INDEX is missing is the first index the instance does
  // have, never All -- a default nobody chose should be the cheapest coherent
  // job, never the dearest one on offer.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [fileError, setFileError] = useState<string | null>(null);

  /**
   * Load a picked FASTA or FASTQ file into the textarea, where the same base
   * count and cap apply as to a pasted query.
   * @param event - The file input's change event.
   */
  const onQueryFile = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const input = event.target;
    const file = input.files?.[0];
    // Cleared so picking the same file again, after editing the textarea,
    // still fires a change.
    input.value = "";
    if (!file) return;
    if (file.size > MAX_QUERY_FILE_BYTES) {
      setFileError(
        `${file.name} is too large to be a single query of up to ${MAX_QUERY_BASES.toLocaleString()} bases.`
      );
      return;
    }
    try {
      const text = await file.text();
      // A binary or non-UTF-8 file (a gzipped FASTQ, say) decodes to U+FFFD,
      // which would be counted as bases and Galaxy would then reject.
      if (text.includes("\uFFFD")) {
        setFileError(`${file.name} isn't a plain-text FASTA or FASTQ file.`);
        return;
      }
      setSequence(text);
      setFileError(null);
    } catch {
      setFileError(`${file.name} could not be read.`);
    }
  };

  /**
   * Put an example in the textarea and pick the indexes it is meant for.
   * @param example - The example clicked.
   */
  const loadExample = (example: LoganExample): void => {
    setSequence(example.sequence);
    setFileError(null);
    setPicked(selectIndexes(options, example.divisions, example.strategies));
  };

  const options = useMemo(() => sortIndexes(search.indexes), [search.indexes]);

  const defaultIndexes = options.includes(DEFAULT_INDEX)
    ? [DEFAULT_INDEX]
    : options.slice(0, 1);
  // Kept to names the instance registers, so a pick made against an older
  // list can't send an index Galaxy no longer has.
  const indexes = picked
    ? options.filter((index) => picked.includes(index))
    : defaultIndexes;
  const sentence = describeIndexSet(options, indexes);

  const query = parseQuery(sequence);
  const { bases, records } = query;
  const tooLong = bases > MAX_QUERY_BASES;
  // The backend refuses multi-record FASTA with a 422; say so here instead.
  const tooManyRecords = records > 1;
  let queryHelp =
    query.format === "fastq"
      ? `${bases} bases. FASTQ; headers and quality scores are ignored.`
      : `${bases} bases. FASTA; headers are ignored.`;
  if (tooLong)
    queryHelp = `${bases} bases, but queries are capped at ${MAX_QUERY_BASES}`;
  if (tooManyRecords)
    queryHelp = `${records} records, but a query is one sequence`;
  if (query.error) queryHelp = query.error;
  // An errored job keeps its jobId with no results forever, so leaving the
  // error out of this leaves the form stuck "running" with no way back.
  const isRunning =
    search.isSubmitting ||
    Boolean(search.jobId && !search.results && !search.error);

  const canSubmit =
    indexes.length > 0 &&
    bases > 0 &&
    !tooLong &&
    !tooManyRecords &&
    !query.error &&
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
              error={tooLong || tooManyRecords || Boolean(query.error)}
              fullWidth
              helperText={queryHelp}
              maxRows={20}
              minRows={6}
              multiline
              onChange={(e): void => {
                setSequence(e.target.value);
                setFileError(null);
              }}
              slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
              value={sequence}
            />
            <ControlRow>
              <Button
                component="label"
                size="small"
                startIcon={<UploadFile />}
                variant="outlined"
              >
                Load FASTA/FASTQ file
                <input
                  accept={QUERY_FILE_TYPES}
                  hidden
                  onChange={onQueryFile}
                  type="file"
                />
              </Button>
              <Typography
                color={fileError ? "error" : "textSecondary"}
                role={fileError ? "alert" : undefined}
                variant="caption"
              >
                {fileError ??
                  "Replaces the text above. One record, read in your browser."}
              </Typography>
            </ControlRow>
            <ControlRow aria-labelledby="logan-examples" role="group">
              <Typography component="span" id="logan-examples" variant="body2">
                Examples
              </Typography>
              <IndexChips>
                {LOGAN_EXAMPLES.map((example) => (
                  <Tooltip describeChild key={example.key} title={example.note}>
                    <Chip
                      clickable
                      label={example.label}
                      onClick={(): void => loadExample(example)}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                ))}
              </IndexChips>
            </ControlRow>
          </FormColumn>

          <FormColumn>
            <Typography variant="h6">Threshold</Typography>
            {/* The reading, the slider and the caption are one control, so they
                sit inside the column's gap rather than spread across it. */}
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
          </FormColumn>

          <FormSpan>
            <IndexHeading>
              <Typography variant="h6">Indexes</Typography>
              <Tooltip
                describeChild
                title="logan-search.org's Fast groups aren't here because they drop the small sub-indexes inside each division, which these indexes can't express, and GenBank_RefSeq isn't deployed on Galaxy Test, where these searches run."
              >
                <InfoOutlined
                  aria-label="Why some logan-search.org groups are missing"
                  color="action"
                  fontSize="small"
                  tabIndex={0}
                />
              </Tooltip>
            </IndexHeading>
            <Typography color="textSecondary" variant="body2">
              Each index is one organism group by one library type. Pick a
              scope, or open Custom to choose index by index.
            </Typography>
            {search.isLoadingIndexes && (
              <ControlRow>
                <CircularProgress size={20} />
                <Typography color="textSecondary" variant="body2">
                  Loading available indexes...
                </Typography>
              </ControlRow>
            )}
            {!search.isLoadingIndexes && options.length === 0 && (
              <Typography color="textSecondary" variant="body2">
                No indexes are available right now.
              </Typography>
            )}
            {!search.isLoadingIndexes && options.length > 0 && (
              <IndexPicker
                defaultNote={
                  !picked && options.includes(DEFAULT_INDEX)
                    ? DEFAULT_NOTE
                    : undefined
                }
                indexes={options}
                onChange={(next): void => setPicked(sortIndexes(next))}
                selected={indexes}
              />
            )}
          </FormSpan>

          <FormSpan>
            <ControlRow>
              <Button
                disabled={!canSubmit}
                onClick={async (): Promise<void> => {
                  // FASTQ goes as its FASTA form; the backend only reads FASTA.
                  const jobId = await search.submit({
                    indexes,
                    sequence: query.fasta,
                    threshold,
                    zvalue: 6,
                  });
                  if (jobId) {
                    onSubmitted?.({
                      indexes,
                      jobId,
                      queryName: queryNameOf(query.fasta),
                      submittedAt: new Date().toISOString(),
                      threshold,
                    });
                  }
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
              {options.length > 0 && (
                <IndexSummary
                  selected={indexes.length}
                  total={options.length}
                />
              )}
            </ControlRow>
            {options.length > 0 && (
              <Typography
                aria-live="polite"
                color="textSecondary"
                variant="body2"
              >
                {sentence}
              </Typography>
            )}
          </FormSpan>
        </FormGrid>
      </CardContent>
    </Card>
  );
};
