import { type GeneSearchMatch } from "@repo/shared/services/genes/types";
import { MATCH_TYPE_NAMES, PRODUCT_MATCH_TYPES } from "./constants";

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
  const shown = PRODUCT_MATCH_TYPES.has(type) ? `"${value}"` : value;
  return `Matched ${name} ${shown}`;
}
