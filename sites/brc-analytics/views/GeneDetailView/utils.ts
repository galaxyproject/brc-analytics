import { type GeneLocation } from "@repo/shared/services/genes/types";
import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";

/**
 * Format a genome location as the gene page shows it.
 * @param location - Genome location.
 * @returns E.g. "NC_037282.1:1,292,966-1,296,696 (+)".
 */
export function formatLocation(location: GeneLocation): string {
  const { end, seqName, start, strand } = location;
  return `${seqName}:${formatNumber(start)}-${formatNumber(end)} (${strand})`;
}
