import {
  ControlRow,
  FormColumn,
  FormGrid,
  FormSpan,
  IndexAxisRow,
  IndexChips,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { ConnectGalaxyAccount } from "@brc/components/LoganSearch/LoganSearchForm/components/ConnectGalaxyAccount/connectGalaxyAccount";
import {
  axisOptions,
  countBases,
  describeIndexSelection,
  type IndexAxisOption,
  indexDivision,
  indexStrategy,
  selectIndexes,
  sortIndexes,
} from "@brc/components/LoganSearch/utils";
import { Search } from "@mui/icons-material";
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
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX, useMemo, useState } from "react";

interface LoganSearchFormProps {
  search: ReturnType<typeof useKmindexSearch>;
}

// Logan-Search caps queries at 2.5 kb; k-mer recall degrades past that and the
// index is built for gene-sized queries, not whole genomes.
const MAX_QUERY_BASES = 2500;

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

interface AxisChipModel extends IndexAxisOption {
  // Selecting this code would leave the job with nothing to search.
  disabled: boolean;
}

/**
 * One toggle chip in an axis row.
 *
 * The span is what carries the tooltip: a disabled MUI chip fires no pointer
 * events of its own, so a wrapper is the only thing left to hover for the
 * reason it is disabled -- which is exactly when the reason is wanted.
 * @param props - Component props.
 * @param props.disabled - Set when picking this value would search nothing.
 * @param props.label - Chip text.
 * @param props.onClick - Called when the chip is clicked.
 * @param props.selected - Whether this value is part of the axis selection.
 * @param props.tooltip - What the chip stands for, or why it cannot be picked.
 * @returns The chip.
 */
function AxisChip({
  disabled = false,
  label,
  onClick,
  selected,
  tooltip,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  selected: boolean;
  tooltip: string;
}): JSX.Element {
  return (
    <Tooltip describeChild title={tooltip}>
      <span>
        <Chip
          aria-pressed={selected}
          clickable
          color={selected ? "primary" : "default"}
          disabled={disabled}
          label={label}
          onClick={onClick}
          // The theme's chips are 20/24px tags. These are the form's main
          // control, so they get a size you can hit and read.
          size="medium"
          sx={{ "& .MuiChip-label": { fontSize: 14, px: 1.5 }, height: 32 }}
          variant="filled"
        />
      </span>
    </Tooltip>
  );
}

/**
 * What a value chip says on hover: what it stands for, or why it is closed.
 * @param option - The value the chip carries.
 * @param disabledReason - Why nothing pairs with it, for the disabled case.
 * @returns The tooltip text.
 */
function chipTooltip(option: AxisChipModel, disabledReason: string): string {
  if (option.disabled) return `${option.code} -- ${disabledReason}`;
  const noun = option.count === 1 ? "index" : "indexes";
  const note = option.note ? ` ${option.note}` : "";
  return `${option.code} -- ${option.count} ${noun}.${note}`;
}

/**
 * One axis of the picker: its label, an All chip, then a chip per value.
 * @param props - Component props.
 * @param props.allTooltip - Tooltip for the All chip.
 * @param props.disabledReason - Tooltip tail for a value nothing pairs with.
 * @param props.label - Row label, shown beside the chips.
 * @param props.labelId - Id the row's group is labelled by.
 * @param props.onSelectAll - Called when All is clicked.
 * @param props.onToggle - Called with the code of the clicked value chip.
 * @param props.options - The row's values, in display order.
 * @param props.picked - Codes currently selected; empty means All.
 * @returns The row.
 */
function AxisRow({
  allTooltip,
  disabledReason,
  label,
  labelId,
  onSelectAll,
  onToggle,
  options,
  picked,
}: {
  allTooltip: string;
  disabledReason: string;
  label: string;
  labelId: string;
  onSelectAll: () => void;
  onToggle: (code: string) => void;
  options: AxisChipModel[];
  picked: string[];
}): JSX.Element {
  return (
    <IndexAxisRow aria-labelledby={labelId} role="group">
      <Typography component="span" id={labelId} variant="body2">
        {label}
      </Typography>
      <IndexChips>
        <AxisChip
          key="all"
          label="All"
          onClick={onSelectAll}
          selected={picked.length === 0}
          tooltip={allTooltip}
        />
        {options.map((option) => (
          <AxisChip
            disabled={option.disabled}
            key={option.code}
            label={option.label}
            onClick={(): void => onToggle(option.code)}
            selected={picked.includes(option.code)}
            tooltip={chipTooltip(option, disabledReason)}
          />
        ))}
      </IndexChips>
    </IndexAxisRow>
  );
}

/**
 * Labels for the codes chosen on one axis, in the row's order rather than the
 * order they were clicked, so the sentence reads the same as the chips do.
 * @param options - The axis's values, in display order.
 * @param picked - Codes currently selected.
 * @returns The chosen labels.
 */
function pickedLabels(options: IndexAxisOption[], picked: string[]): string[] {
  return options
    .filter((option) => picked.includes(option.code))
    .map((option) => option.label);
}

/**
 * Add a code to an axis selection, or take it out again.
 * @param picked - Codes currently selected.
 * @param code - The clicked code.
 * @returns The new selection.
 */
function toggleCode(picked: string[], code: string): string[] {
  return picked.includes(code)
    ? picked.filter((value) => value !== code)
    : [...picked, code];
}

export const LoganSearchForm = ({
  search,
}: LoganSearchFormProps): JSX.Element => {
  const [sequence, setSequence] = useState(SAMPLE_QUERY);
  // Division and strategy codes. null means "not touched": the default is
  // derived from the loaded list rather than seeded, because the list arrives
  // asynchronously and a default the instance lacks would select nothing.
  const [organismsPicked, setOrganismsPicked] = useState<string[] | null>(null);
  const [librariesPicked, setLibrariesPicked] = useState<string[] | null>(null);
  const [threshold, setThreshold] = useState(0.5);

  const options = useMemo(() => sortIndexes(search.indexes), [search.indexes]);
  const organismOptions = useMemo(
    () => axisOptions(options, "division"),
    [options]
  );
  const libraryOptions = useMemo(
    () => axisOptions(options, "strategy"),
    [options]
  );

  const hasDefault = options.includes(DEFAULT_INDEX);
  const organisms =
    organismsPicked ?? (hasDefault ? [indexDivision(DEFAULT_INDEX)] : []);
  const libraries =
    librariesPicked ?? (hasDefault ? [indexStrategy(DEFAULT_INDEX)] : []);

  const indexes = selectIndexes(options, organisms, libraries);

  // A value is unreachable only against the *other* row's current selection,
  // and a value already picked is part of what the other row was filtered by:
  // disabling it would trap the selection in the state that disabled it.
  const organismChips: AxisChipModel[] = organismOptions.map((option) => ({
    ...option,
    disabled:
      !organisms.includes(option.code) &&
      selectIndexes(options, [option.code], libraries).length === 0,
  }));
  const libraryChips: AxisChipModel[] = libraryOptions.map((option) => ({
    ...option,
    disabled:
      !libraries.includes(option.code) &&
      selectIndexes(options, organisms, [option.code]).length === 0,
  }));

  const sentence = describeIndexSelection({
    libraries: pickedLabels(libraryOptions, libraries),
    organisms: pickedLabels(organismOptions, organisms),
    selected: indexes,
    total: options.length,
  });

  const bases = countBases(sequence);
  const tooLong = bases > MAX_QUERY_BASES;
  // An errored job keeps its jobId with no results forever, so leaving the
  // error out of this leaves the form stuck "running" with no way back.
  const isRunning =
    search.isSubmitting ||
    Boolean(search.jobId && !search.results && !search.error);

  const canSubmit =
    indexes.length > 0 &&
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
              minRows={6}
              multiline
              onChange={(e): void => setSequence(e.target.value)}
              slotProps={{ input: { sx: { fontFamily: "monospace" } } }}
              value={sequence}
            />
          </FormColumn>

          <FormColumn>
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
            <Typography variant="h6">Indexes</Typography>
            <Typography color="textSecondary" variant="body2">
              Every index is one organism group by one library type. A job
              searches each index that matches both rows.
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
              <>
                <AxisRow
                  allTooltip="Every organism group registered."
                  disabledReason="no index pairs it with the selected library types."
                  label="Organism"
                  labelId="logan-axis-organism"
                  onSelectAll={(): void => setOrganismsPicked([])}
                  onToggle={(code): void =>
                    setOrganismsPicked(toggleCode(organisms, code))
                  }
                  options={organismChips}
                  picked={organisms}
                />
                <AxisRow
                  allTooltip="Every library type registered."
                  disabledReason="no index pairs it with the selected organism groups."
                  label="Library type"
                  labelId="logan-axis-library"
                  onSelectAll={(): void => setLibrariesPicked([])}
                  onToggle={(code): void =>
                    setLibrariesPicked(toggleCode(libraries, code))
                  }
                  options={libraryChips}
                  picked={libraries}
                />
                <Typography
                  aria-live="polite"
                  color="textSecondary"
                  variant="body2"
                >
                  {sentence}
                </Typography>
              </>
            )}
          </FormSpan>

          <FormSpan>
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
                  setOrganismsPicked(null);
                  setLibrariesPicked(null);
                  search.reset();
                }}
                variant="outlined"
              >
                Reset
              </Button>
            </ControlRow>
          </FormSpan>
        </FormGrid>
      </CardContent>
    </Card>
  );
};
