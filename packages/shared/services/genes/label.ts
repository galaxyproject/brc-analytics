import { type Gene } from "./types";

/**
 * What a gene is called: its locus tag, else its name.
 * @param gene - The gene.
 * @returns The gene's locus tag or name.
 */
export function geneLabel(gene: Pick<Gene, "locusTag" | "name">): string {
  // The API sets at least one of them.
  return gene.locusTag ?? gene.name ?? "";
}

/**
 * A gene's symbol, unless it is the same as its label.
 * @param gene - The gene.
 * @returns The symbol, or null.
 */
export function geneSymbol(
  gene: Pick<Gene, "locusTag" | "name" | "symbol">
): string | null {
  return gene.symbol && gene.symbol !== geneLabel(gene) ? gene.symbol : null;
}

/**
 * A gene's page title: its label, then its symbol in brackets if it has one.
 * @param gene - The gene.
 * @returns E.g. "PF3D7_1133400 (AMA1)".
 */
export function geneTitle(
  gene: Pick<Gene, "locusTag" | "name" | "symbol">
): string {
  const symbol = geneSymbol(gene);
  return symbol ? `${geneLabel(gene)} (${symbol})` : geneLabel(gene);
}
