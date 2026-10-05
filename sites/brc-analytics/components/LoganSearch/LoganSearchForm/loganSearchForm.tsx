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
  LOGAN_EXAMPLES,
  type LoganExample,
} from "@brc/components/LoganSearch/LoganSearchForm/examples";
import {
  queryNameOf,
  type RecentSearch,
} from "@brc/components/LoganSearch/LoganSearchHistory/recentSearches";
import {
  axisOptions,
  countBases,
  countRecords,
  describeIndexSelection,
  type IndexAxis,
  type IndexAxisOption,
  indexDivision,
  indexPresets,
  indexStrategy,
  selectIndexes,
  sortIndexes,
} from "@brc/components/LoganSearch/utils";
import { Search, UploadFile } from "@mui/icons-material";
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
// far past anything the 2,500-base cap would let through.
const MAX_QUERY_FILE_BYTES = 1024 * 1024;
const QUERY_FILE_TYPES = ".fa,.fasta,.fna,.txt";

// Paired with SAMPLE_QUERY below: this is the division P. falciparum sits in,
// and it carries all but a handful of that query's hits. Fall back to whatever
// the instance actually has registered.
const DEFAULT_INDEX = "GENOMIC_INV";

// The theme's chips are 20/24px tags. These are the form's main control, so
// they get a size you can hit and read, and a focus ring you can see: the
// default focus style is a slightly darker grey on a grey chip, which at a
// glance is no ring at all.
const CHIP_SX = {
  "& .MuiChip-label": { fontSize: 14, px: 1.5 },
  "&.Mui-focusVisible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: "2px",
  },
  // The chip stays clickable so it keeps the tab order and the tooltip, which
  // leaves MUI's pointer cursor promising a click that does nothing.
  "&[aria-disabled='true']": { cursor: "default" },
  height: 32,
};

// The first example: a 500 bp window of the P. falciparum 18S rRNA. Measured
// against DEFAULT_INDEX at threshold 0.5 it returns 17,629 hits -- 706 pages
// at 25 a page, where the bacterial 16S fragment that used to sit here
// returned 31,405 against METAGENOMIC_ENV. Neither truncates; the old pair was
// a worse first run, not a truncated one. What the swap really buys is a
// coherent pair: a Plasmodium query against the division Plasmodium sits in,
// rather than against environmental metagenomes.
const SAMPLE_QUERY = LOGAN_EXAMPLES[0].sequence;

interface AxisChipModel extends IndexAxisOption {
  // Settled with the other row's selection in hand, so the chip itself never
  // has to work out what it stands for.
  tooltip: string;
  // Nothing registered pairs this value with the other row's selection.
  unavailable: boolean;
}

/**
 * One toggle chip in an axis row.
 *
 * An unavailable value is marked rather than disabled. MUI's `disabled` drops
 * the chip out of the tab order and turns off its pointer events, which takes
 * the reason it cannot be picked away from the reader most likely to need it
 * read out.
 * @param props - Component props.
 * @param props.label - Chip text.
 * @param props.onClick - Called when a pickable chip is clicked.
 * @param props.selected - Whether this value is part of the axis selection.
 * @param props.tooltip - What the chip stands for, or why it cannot be picked.
 * @param props.unavailable - Set when picking this value would search nothing.
 * @returns The chip.
 */
function AxisChip({
  label,
  onClick,
  selected,
  tooltip,
  unavailable = false,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
  tooltip: string;
  unavailable?: boolean;
}): JSX.Element {
  return (
    <Tooltip describeChild title={tooltip}>
      <Chip
        aria-disabled={unavailable || undefined}
        aria-pressed={selected}
        clickable
        color={selected ? "primary" : "default"}
        label={label}
        // The handler stays attached when the value is unavailable: without one
        // the chip is not a button, and the button is what the tooltip
        // describes.
        onClick={(): void => {
          if (!unavailable) onClick();
        }}
        size="medium"
        sx={unavailable ? { ...CHIP_SX, opacity: 0.5 } : CHIP_SX}
        variant="filled"
      />
    </Tooltip>
  );
}

/**
 * What a value chip says on hover: what it stands for, or why it is closed.
 * @param option - The value the chip carries.
 * @param unavailable - Whether anything pairs it with the other row.
 * @param reason - Why nothing pairs with it, for the unavailable case.
 * @returns The tooltip text.
 */
function chipTooltip(
  option: IndexAxisOption,
  unavailable: boolean,
  reason: string
): string {
  if (unavailable) return `${option.code} -- ${reason}`;
  const noun = option.count === 1 ? "index" : "indexes";
  const note = option.note ? ` ${option.note}` : "";
  return `${option.code} -- ${option.count} ${noun}.${note}`;
}

/**
 * The chips one row offers: its values in display order, which of them the
 * other row has closed off, and what each of them says on hover.
 *
 * A value is unreachable only against the *other* row's current selection, and
 * a value already picked is part of what the other row was filtered by: closing
 * it would trap the selection in the state that closed it. The two rows are the
 * same rule with the axes swapped, so they are one function called twice.
 * @param indexes - Index names from the API.
 * @param picked - Codes selected on this axis; empty means all.
 * @param other - Codes selected on the other axis; empty means all.
 * @param axis - Which half of STRATEGY_DIVISION this row picks.
 * @returns The row's chips, in display order.
 */
function axisChips(
  indexes: string[],
  picked: string[],
  other: string[],
  axis: IndexAxis
): AxisChipModel[] {
  const isDivision = axis === "division";
  const reason = isDivision
    ? "no index pairs it with the selected library types."
    : "no index pairs it with the selected organism groups.";
  return axisOptions(indexes, axis).map((option) => {
    const paired = isDivision
      ? selectIndexes(indexes, [option.code], other)
      : selectIndexes(indexes, other, [option.code]);
    const unavailable = !picked.includes(option.code) && paired.length === 0;
    return {
      ...option,
      tooltip: chipTooltip(option, unavailable, reason),
      unavailable,
    };
  });
}

/**
 * One axis of the picker: its label, an All chip, then a chip per value.
 * @param props - Component props.
 * @param props.allTooltip - Tooltip for the All chip.
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
  label,
  labelId,
  onSelectAll,
  onToggle,
  options,
  picked,
}: {
  allTooltip: string;
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
            key={option.code}
            label={option.label}
            onClick={(): void => onToggle(option.code)}
            selected={picked.includes(option.code)}
            tooltip={option.tooltip}
            unavailable={option.unavailable}
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
  onSubmitted,
  search,
}: LoganSearchFormProps): JSX.Element => {
  const [sequence, setSequence] = useState(SAMPLE_QUERY);
  // Division and strategy codes. null means "not touched": the default is
  // derived from the loaded list rather than seeded, because the list arrives
  // asynchronously and a default the instance lacks would select nothing. What
  // it falls back to when DEFAULT_INDEX is missing is the first index the
  // instance does have, never All -- a default nobody chose should be the
  // cheapest coherent job, never the dearest one on offer.
  const [organismsPicked, setOrganismsPicked] = useState<string[] | null>(null);
  const [librariesPicked, setLibrariesPicked] = useState<string[] | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [fileError, setFileError] = useState<string | null>(null);

  /**
   * Load a picked FASTA file into the textarea, where the same base count and
   * cap apply as to a pasted query.
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
      setSequence(await file.text());
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
    setOrganismsPicked(example.divisions);
    setLibrariesPicked(example.strategies);
  };

  const options = useMemo(() => sortIndexes(search.indexes), [search.indexes]);

  const defaultIndexes = options.includes(DEFAULT_INDEX)
    ? [DEFAULT_INDEX]
    : options.slice(0, 1);
  const organisms = organismsPicked ?? defaultIndexes.map(indexDivision);
  const libraries = librariesPicked ?? defaultIndexes.map(indexStrategy);

  const indexes = selectIndexes(options, organisms, libraries);
  const organismChips = axisChips(options, organisms, libraries, "division");
  const libraryChips = axisChips(options, libraries, organisms, "strategy");

  // Lit by what the chips come to rather than by which preset was clicked
  // last, so picking the same set by hand lights it too and a tweak after a
  // click turns it off.
  const selectedKey = indexes.join(",");
  const presets = indexPresets(options).map((preset) => {
    const presetIndexes = selectIndexes(
      options,
      preset.divisions,
      preset.strategies
    );
    const noun = presetIndexes.length === 1 ? "index" : "indexes";
    return {
      ...preset,
      selected: presetIndexes.join(",") === selectedKey,
      tooltip: `${preset.loganName} on logan-search.org -- ${preset.note} ${presetIndexes.length} ${noun}.`,
    };
  });

  const sentence = describeIndexSelection({
    libraries: pickedLabels(libraryChips, libraries),
    organisms: pickedLabels(organismChips, organisms),
    selected: indexes,
    total: options.length,
  });

  const bases = countBases(sequence);
  const tooLong = bases > MAX_QUERY_BASES;
  // The backend refuses multi-record FASTA with a 422; say so here instead.
  const records = countRecords(sequence);
  const tooManyRecords = records > 1;
  let queryHelp = `${bases} bases. FASTA; headers are ignored.`;
  if (tooLong)
    queryHelp = `${bases} bases -- queries are capped at ${MAX_QUERY_BASES}`;
  if (tooManyRecords)
    queryHelp = `${records} records -- a query is one sequence`;
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
              error={tooLong || tooManyRecords}
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
                Load FASTA file
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
                <IndexAxisRow aria-labelledby="logan-presets" role="group">
                  <Typography
                    component="span"
                    id="logan-presets"
                    variant="body2"
                  >
                    Presets
                  </Typography>
                  <IndexChips>
                    {presets.map((preset) => (
                      <AxisChip
                        key={preset.loganName}
                        label={preset.label}
                        onClick={(): void => {
                          setOrganismsPicked(preset.divisions);
                          setLibrariesPicked(preset.strategies);
                        }}
                        selected={preset.selected}
                        tooltip={preset.tooltip}
                      />
                    ))}
                  </IndexChips>
                </IndexAxisRow>
                <Typography color="textSecondary" variant="caption">
                  logan-search.org&apos;s Fast groups aren&apos;t here because
                  they drop the small sub-indexes inside each division, which
                  these indexes can&apos;t express, and GenBank_RefSeq
                  isn&apos;t deployed on this instance.
                </Typography>
                <AxisRow
                  allTooltip="Every organism group registered."
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
                  const jobId = await search.submit({
                    indexes,
                    sequence,
                    threshold,
                    zvalue: 6,
                  });
                  if (jobId) {
                    onSubmitted?.({
                      indexes,
                      jobId,
                      queryName: queryNameOf(sequence),
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
