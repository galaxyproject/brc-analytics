import { type GeneSearchMatch } from "@repo/shared/services/genes/types";
import { MATCH_TYPE_NAMES } from "./constants";

/**
 * What a search result matched on, as the results list says it.
 * @param match - The result's match.
 * @param match.type - The kind of term it matched.
 * @param match.value - The matched alias, or product.
 * @returns E.g. "Matched protein accession XP_001348015.1", or
 * 'Matched protein product "apical membrane antigen 1"'.
 */
export function describeMatch({ type, value }: GeneSearchMatch): string {
  const name = MATCH_TYPE_NAMES[type] ?? type.replaceAll("_", " ");
  // A product (transcript_product, protein_product) is quoted.
  const shown = type.endsWith("_product") ? `"${value}"` : value;
  return `Matched ${name} ${shown}`;
}
