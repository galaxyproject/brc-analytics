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

/**
 * The UCSC Genome Browser address that opens on a genome location. GFF3 and
 * UCSC's position both count from 1 and include both ends, so the coordinates
 * pass through unchanged.
 * @param ucscBrowserUrl - The assembly's UCSC Genome Browser address.
 * @param location - Genome location.
 * @returns E.g. "https://genome.ucsc.edu/h/GCF_000002765.6?position=NC_004325.2:226036-227419".
 */
export function getUcscPositionUrl(
  ucscBrowserUrl: string,
  location: GeneLocation
): string {
  const { end, seqName, start } = location;
  const separator = ucscBrowserUrl.includes("?") ? "&" : "?";
  return `${ucscBrowserUrl}${separator}position=${encodeURIComponent(seqName)}:${start}-${end}`;
}
