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
