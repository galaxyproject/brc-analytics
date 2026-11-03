import {
  type GeneAlias,
  type GeneLocation,
} from "@repo/shared/services/genes/types";
import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { NCBI_GENE_ID_ALIAS_TYPE, NCBI_GENE_URL } from "./constants";

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
 * A gene's NCBI Gene page, from its NCBI GeneID alias.
 * @param aliases - The gene's aliases.
 * @returns E.g. "https://www.ncbi.nlm.nih.gov/gene/810891", or null when the
 * gene has no NCBI GeneID.
 */
export function getNcbiGeneUrl(aliases: GeneAlias[]): string | null {
  const geneId = aliases.find(
    ({ type }) => type === NCBI_GENE_ID_ALIAS_TYPE
  )?.value;
  return geneId ? `${NCBI_GENE_URL}/${encodeURIComponent(geneId)}` : null;
}

/**
 * The UCSC Genome Browser address that opens on a genome location. GFF3 and
 * UCSC's position both count from 1 and include both ends, so the coordinates
 * pass through unchanged. The assembly's address has no query string (it is
 * always https://genome.ucsc.edu/h/<accession>), so the position is appended
 * as the first query parameter.
 * @param ucscBrowserUrl - The assembly's UCSC Genome Browser address, or null
 * when UCSC has no browser for it.
 * @param location - Genome location.
 * @returns E.g. "https://genome.ucsc.edu/h/GCF_000002765.6?position=NC_004325.2:226036-227419",
 * or null when there is no browser address.
 */
export function getUcscPositionUrl(
  ucscBrowserUrl: string | null,
  location: GeneLocation
): string | null {
  if (!ucscBrowserUrl) return null;
  const { end, seqName, start } = location;
  return `${ucscBrowserUrl}?position=${encodeURIComponent(seqName)}:${start}-${end}`;
}
