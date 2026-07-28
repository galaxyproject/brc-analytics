/**
 * kmindex index names are STRATEGY_DIVISION, e.g. "METAGENOMIC_ENV" or
 * "GENOMICSINGLECELL_BCT". There are over a hundred of them, which is far too
 * many for one flat dropdown, so the picker splits them into two axes.
 */
export interface IndexAxes {
  byStrategy: Map<string, string[]>;
  strategies: string[];
}

/**
 * Group index names into strategy -> divisions.
 * @param indexes - Flat list of index names from the API.
 * @returns Strategies and the divisions available under each.
 */
export function groupIndexes(indexes: string[]): IndexAxes {
  const byStrategy = new Map<string, string[]>();

  for (const index of indexes) {
    // Split on the LAST underscore: strategies themselves contain underscores
    // in neither direction today, but divisions are always a single token.
    const separator = index.lastIndexOf("_");
    if (separator < 1) continue;
    const strategy = index.slice(0, separator);
    const division = index.slice(separator + 1);
    const divisions = byStrategy.get(strategy) ?? [];
    divisions.push(division);
    byStrategy.set(strategy, divisions);
  }

  for (const divisions of byStrategy.values()) divisions.sort();

  return { byStrategy, strategies: [...byStrategy.keys()].sort() };
}

/**
 * Reassemble an index name from its two axes.
 * @param strategy - Library strategy, e.g. "METAGENOMIC".
 * @param division - Taxonomic division, e.g. "ENV".
 * @returns The index name, or an empty string when either axis is unset.
 */
export function toIndexName(strategy: string, division: string): string {
  if (!strategy || !division) return "";
  return `${strategy}_${division}`;
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
