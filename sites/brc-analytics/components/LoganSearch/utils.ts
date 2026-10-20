/**
 * kmindex index names are STRATEGY_DIVISION, e.g. "METAGENOMIC_ENV" or
 * "GENOMICSINGLECELL_BCT". The tool's select is multiple="true", so a query can
 * name any combination of them; the two halves are the two facts about a run
 * that a person actually picks by, so the form offers them as axes rather than
 * offering a list of over a hundred names.
 */

/**
 * Library strategy an index belongs to: everything before the last underscore.
 * @param index - Index name from the API.
 * @returns The strategy prefix, or the whole name when there is no separator.
 */
export function indexStrategy(index: string): string {
  // Split on the LAST underscore: divisions are always a single trailing token.
  const separator = index.lastIndexOf("_");
  return separator < 1 ? index : index.slice(0, separator);
}

/**
 * SRA division an index belongs to: the token after the last underscore.
 * @param index - Index name from the API.
 * @returns The division code, or the whole name when there is no separator.
 */
export function indexDivision(index: string): string {
  const separator = index.lastIndexOf("_");
  return separator < 1 ? index : index.slice(separator + 1);
}

/**
 * Sort index names by strategy, then by division, so a selection reads as
 * grouped everywhere it is listed -- the sentence under the chips, and the
 * payload the job is submitted with.
 * @param indexes - Flat list of index names from the API.
 * @returns A new, sorted list.
 */
export function sortIndexes(indexes: string[]): string[] {
  return [...indexes].sort(
    (a, b) =>
      indexStrategy(a).localeCompare(indexStrategy(b)) || a.localeCompare(b)
  );
}

export interface IndexAxisValue {
  code: string;
  label: string;
  // Where the label alone would mislead: what the division actually holds.
  note?: string;
}

export interface IndexAxisOption extends IndexAxisValue {
  // Registered indexes carrying this code.
  count: number;
}

export type IndexAxis = "division" | "strategy";

/* Order, labels and notes for the codes we know. Deliberately not
   alphabetical: organisms run small to large and then the two catch-alls, so
   the row reads as a scale rather than as an index. */
const DIVISIONS: IndexAxisValue[] = [
  { code: "BCT", label: "Bacteria", note: "Bacteria and archaea." },
  { code: "VRL", label: "Viruses" },
  { code: "PHG", label: "Phage" },
  { code: "PLN", label: "Plants and fungi" },
  {
    code: "INV",
    label: "Invertebrates",
    note: "GenBank's invertebrate division, which also holds protists such as Plasmodium.",
  },
  { code: "VRT", label: "Other vertebrates" },
  { code: "MAM", label: "Other mammals" },
  { code: "ROD", label: "Rodents" },
  { code: "MICE", label: "Mouse" },
  { code: "PRI", label: "Primates" },
  { code: "HUMAN", label: "Human" },
  {
    code: "ENV",
    label: "Environmental",
    note: "Samples with no organism recorded. Metagenomic only.",
  },
  { code: "UNKNOWN", label: "Unclassified" },
];

/* Libraries run DNA to RNA and then the special cases, so the two that carry
   most of Logan sit at the head of the row. */
const STRATEGIES: IndexAxisValue[] = [
  { code: "GENOMIC", label: "Genomic" },
  { code: "METAGENOMIC", label: "Metagenomic" },
  { code: "TRANSCRIPTOMIC", label: "Transcriptomic" },
  { code: "METATRANSCRIPTOMIC", label: "Metatranscriptomic" },
  { code: "GENOMICSINGLECELL", label: "Single-cell genomic" },
  { code: "TRANSCRIPTOMICSINGLECELL", label: "Single-cell transcriptomic" },
  { code: "VIRALRNA", label: "Viral RNA" },
  { code: "SYNTHETIC", label: "Synthetic" },
  { code: "OTHER", label: "Other" },
];

/**
 * The values one axis actually offers, given what the instance registered.
 *
 * The tables above supply order and copy, never the list itself: a code they
 * do not know still gets a chip, so a division added upstream is a row we have
 * not written a label for rather than an index nobody can reach. A code they
 * do know with nothing registered under it does not appear at all.
 * @param indexes - Index names from the API.
 * @param axis - Which half of STRATEGY_DIVISION to read.
 * @returns The present values, table order first, then unknown codes A to Z.
 */
export function axisOptions(
  indexes: string[],
  axis: IndexAxis
): IndexAxisOption[] {
  const read = axis === "division" ? indexDivision : indexStrategy;
  const counts = new Map<string, number>();
  for (const index of indexes) {
    const code = read(index);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const table = axis === "division" ? DIVISIONS : STRATEGIES;
  const known = new Set(table.map((value) => value.code));
  const options: IndexAxisOption[] = [];
  for (const value of table) {
    const count = counts.get(value.code);
    if (count) options.push({ ...value, count });
  }
  const extras = [...counts.entries()]
    .filter(([code]) => !known.has(code))
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [code, count] of extras) {
    options.push({ code, count, label: code });
  }
  return options;
}

/**
 * The indexes a job searches for a given pair of axis selections.
 *
 * The two rows are a product, not a filter chain, and an empty selection on an
 * axis is no constraint at all -- which is what lets All be the resting state
 * rather than a shortcut for ticking all thirteen.
 * @param indexes - Index names from the API.
 * @param divisions - Chosen division codes; empty means every division.
 * @param strategies - Chosen strategy codes; empty means every strategy.
 * @returns The matching names, in the order they arrived in.
 */
export function selectIndexes(
  indexes: string[],
  divisions: string[],
  strategies: string[]
): string[] {
  const wantedDivisions = new Set(divisions);
  const wantedStrategies = new Set(strategies);
  return indexes.filter(
    (index) =>
      (wantedDivisions.size === 0 ||
        wantedDivisions.has(indexDivision(index))) &&
      (wantedStrategies.size === 0 ||
        wantedStrategies.has(indexStrategy(index)))
  );
}

export interface IndexPreset {
  divisions: string[];
  label: string;
  // The group's name on logan-search.org, so a reader coming from there can
  // find the one they know.
  loganName: string;
  // What the preset searches, for its tooltip.
  note: string;
  strategies: string[];
}

interface IndexPresetRule {
  // Codes the preset keeps on each axis; omitted means the whole axis.
  division?: (code: string) => boolean;
  label: string;
  loganName: string;
  note: string;
  strategy?: (code: string) => boolean;
}

const VIRAL_AND_HUMAN = new Set(["HUMAN", "PHG", "VRL"]);

/* logan-search.org's groups that come out as a product of our two axes, and
   so as a chip selection. Its Fast groups are left out because they drop the
   small sub-indexes inside each division, which a STRATEGY_DIVISION index
   cannot express, and GenBank_RefSeq because nothing like it is deployed. */
const PRESET_RULES: IndexPresetRule[] = [
  { label: "All", loganName: "All", note: "Every registered index." },
  {
    division: (code) => !VIRAL_AND_HUMAN.has(code),
    label: "All but viral and human",
    loganName: "All_No_viral_human",
    note: "Every index except viruses, phage and human.",
  },
  {
    label: "Transcriptomic",
    loganName: "Transcriptomic",
    note: "Bulk and single-cell transcriptomic libraries.",
    strategy: (code) =>
      code === "TRANSCRIPTOMIC" || code === "TRANSCRIPTOMICSINGLECELL",
  },
  {
    label: "Metatranscriptomic",
    loganName: "Metatranscriptomic",
    note: "Metatranscriptomic libraries.",
    strategy: (code) => code === "METATRANSCRIPTOMIC",
  },
  {
    label: "Metagenomic",
    loganName: "Metagenomic",
    note: "Metagenomic libraries.",
    strategy: (code) => code === "METAGENOMIC",
  },
];

/**
 * The logan-search.org groups this instance can offer, as axis selections.
 *
 * Read off the registered list rather than written out as index names, so a
 * division added upstream lands in All_No_viral_human without anyone editing
 * this, and a preset with nothing registered under it is not offered at all.
 * An axis left whole is an empty selection, the same All the chip rows use.
 * @param indexes - Index names from the API.
 * @returns The presets that select at least one index, in display order.
 */
export function indexPresets(indexes: string[]): IndexPreset[] {
  const allDivisions = axisOptions(indexes, "division").map(({ code }) => code);
  const allStrategies = axisOptions(indexes, "strategy").map(
    ({ code }) => code
  );
  const presets: IndexPreset[] = [];
  for (const { division, label, loganName, note, strategy } of PRESET_RULES) {
    const divisions = division ? allDivisions.filter(division) : [];
    const strategies = strategy ? allStrategies.filter(strategy) : [];
    // A rule that kept nothing would read as an empty selection, which is no
    // constraint at all, and select everything under the wrong name.
    if (division && divisions.length === 0) continue;
    if (strategy && strategies.length === 0) continue;
    if (selectIndexes(indexes, divisions, strategies).length === 0) continue;
    presets.push({ divisions, label, loganName, note, strategies });
  }
  return presets;
}

/**
 * Lowercase a label's first character so it can sit inside a sentence.
 * @param label - Display label as it appears on a chip.
 * @returns The label, cased for mid-sentence use.
 */
function lowerFirst(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * Join labels the way a sentence would, Oxford comma and all.
 * @param labels - Labels already cased for mid-sentence use.
 * @returns One phrase.
 */
export function joinNaturally(labels: string[]): string {
  if (labels.length < 2) return labels.join("");
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * What the current selection searches, as the sentence under the chip rows.
 *
 * A short selection names its indexes outright: four names say more than the
 * axes they came from, and they are the names the job reports back against.
 * Past that the names stop being readable, and the axes are what was chosen.
 * @param args - The selection to describe.
 * @param args.libraries - Labels of the chosen library types; empty means all.
 * @param args.organisms - Labels of the chosen organism groups; empty means all.
 * @param args.selected - The indexes the two selections come to.
 * @param args.total - How many indexes are registered in all.
 * @returns One sentence.
 */
export function describeIndexSelection(args: {
  libraries: string[];
  organisms: string[];
  selected: string[];
  total: number;
}): string {
  const { libraries, organisms, selected, total } = args;
  if (selected.length === 0) return "No index matches that combination.";
  if (selected.length === total)
    return `Searching all ${total.toLocaleString()} indexes.`;
  const share = `${selected.length.toLocaleString()} of ${total.toLocaleString()}`;
  if (selected.length <= 4)
    return `Searching ${share} indexes: ${selected.join(", ")}.`;
  const organismPhrase = organisms.length
    ? joinNaturally(organisms.map(lowerFirst))
    : "every organism";
  const libraryPhrase = libraries.length
    ? joinNaturally(libraries.map(lowerFirst))
    : "every library type";
  return `Searching ${share} indexes: ${organismPhrase}; ${libraryPhrase}.`;
}

/**
 * Strip FASTA headers and whitespace to count actual sequence bases.
 * @param fasta - Raw textarea contents.
 * @returns Number of sequence characters.
 */
export function countBases(fasta: string): number {
  return fasta
    .split("\n")
    .filter((line) => !line.startsWith(">"))
    .join("")
    .replace(/\s/g, "").length;
}

/**
 * Count FASTA records by their header lines.
 * @param fasta - Raw textarea contents.
 * @returns Number of lines that open a record.
 */
export function countRecords(fasta: string): number {
  return fasta.split("\n").filter((line) => line.trim().startsWith(">")).length;
}

export interface ParsedQuery {
  bases: number;
  // Why a FASTQ query can't be read, as a sentence; null when it can.
  error: string | null;
  // The query as the backend takes it, which is FASTA only.
  fasta: string;
  format: "fasta" | "fastq";
  records: number;
}

const FASTQ_SHAPE = "four lines: @header, sequence, +, quality";

/**
 * Read the query box as FASTA or FASTQ.
 *
 * FASTQ is told apart by its leading "@", and turned into FASTA here so the
 * request the backend sees is the same either way. Records are read as
 * strict four-line groups: wrapped FASTQ is rare, and a quality line can
 * itself start with "@", so it can't be split reliably on headers.
 * @param text - Raw textarea contents.
 * @returns The query's format, its FASTA form, and what the form checks.
 */
export function parseQuery(text: string): ParsedQuery {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines[0]?.startsWith("@")) {
    return {
      bases: countBases(text),
      error: null,
      fasta: text,
      format: "fasta",
      records: countRecords(text),
    };
  }
  const records: { header: string; sequence: string }[] = [];
  let error: string | null = null;
  for (let start = 0; start < lines.length && !error; start += 4) {
    const n = start / 4 + 1;
    const [header, sequence, plus, quality] = lines.slice(start, start + 4);
    if (!header.startsWith("@")) {
      error = `Malformed FASTQ: record ${n} doesn't start with an @ header. Each record is ${FASTQ_SHAPE}.`;
    } else if (quality === undefined) {
      error = `Malformed FASTQ: record ${n} is incomplete. Each record is ${FASTQ_SHAPE}.`;
    } else if (!plus.startsWith("+")) {
      error = `Malformed FASTQ: record ${n} has no + line after its sequence. Each record is ${FASTQ_SHAPE}.`;
    } else if (quality.length !== sequence.length) {
      error = `Malformed FASTQ: record ${n} has ${sequence.length} bases but ${quality.length} quality scores.`;
    } else {
      records.push({ header: header.slice(1), sequence });
    }
  }
  const fasta = records
    .map(({ header, sequence }) => `>${header}\n${sequence}\n`)
    .join("");
  return {
    bases: countBases(fasta),
    error,
    fasta,
    format: "fastq",
    records: records.length,
  };
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
 * @param total - Rows counted in all.
 * @returns Percentage string.
 */
export function formatShare(count: number, total: number): string {
  if (total <= 0) return "–";
  if (count === 0) return "0%";
  const share = (count / total) * 100;
  if (share < 0.1) return "<0.1%";
  if (count < total && share > 99.9) return ">99.9%";
  return `${share.toFixed(1)}%`;
}
