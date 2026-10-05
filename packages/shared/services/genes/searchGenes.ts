import { GENE_FIXTURE } from "./fixture";
import { type GeneSearchResult } from "./types";

/**
 * Searches the gene fixture by ID, symbol, or alias.
 * Replace this module with the real API client when it exists.
 * @param query - Search string to match against gene ID, symbol, and aliases.
 * @returns Matching genes with the alias that matched, if any.
 */
export function searchGenes(query: string): GeneSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return GENE_FIXTURE.reduce<GeneSearchResult[]>((results, gene) => {
    if (gene.geneId.toLowerCase() === q || gene.symbol.toLowerCase() === q) {
      results.push({ gene, matchedAlias: null });
    } else {
      const alias = gene.aliases.find((a) => a.toLowerCase() === q);
      if (alias) {
        results.push({ gene, matchedAlias: alias });
      }
    }
    return results;
  }, []);
}
