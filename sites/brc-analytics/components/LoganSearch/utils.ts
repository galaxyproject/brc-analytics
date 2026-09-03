/**
 * kmindex index names are STRATEGY_DIVISION, e.g. "METAGENOMIC_ENV" or
 * "GENOMICSINGLECELL_BCT". The tool's select is multiple="true", so a query can
 * name any combination of them; the strategy prefix is only used to group the
 * options so a list of over a hundred stays scannable.
 */

/**
 * Library strategy an index belongs to, used as its option group.
 * @param index - Index name from the API.
 * @returns The strategy prefix, or the whole name when there is no separator.
 */
export function indexStrategy(index: string): string {
  // Split on the LAST underscore: divisions are always a single trailing token.
  const separator = index.lastIndexOf("_");
  return separator < 1 ? index : index.slice(0, separator);
}

/**
 * Sort index names by strategy, then by division, so grouped options stay
 * contiguous -- MUI's groupBy renders headers in list order, not by key.
 * @param indexes - Flat list of index names from the API.
 * @returns A new, sorted list.
 */
export function sortIndexes(indexes: string[]): string[] {
  return [...indexes].sort(
    (a, b) =>
      indexStrategy(a).localeCompare(indexStrategy(b)) || a.localeCompare(b)
  );
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
  if (total <= 0) return "--";
  if (count === 0) return "0%";
  const share = (count / total) * 100;
  if (share < 0.1) return "<0.1%";
  if (count < total && share > 99.9) return ">99.9%";
  return `${share.toFixed(1)}%`;
}
