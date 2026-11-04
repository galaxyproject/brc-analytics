import {
  type GeneAlias,
  type GeneLocation,
  type GeneProvenance,
} from "@repo/shared/services/genes/types";
import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import {
  GENE_TYPE_NAMES,
  NCBI_GENE_ID_ALIAS_TYPE,
  NCBI_GENE_URL,
} from "./constants";

/**
 * The gene page's line naming the annotation a gene was read from: its
 * publisher, provider, release label, release date and the date its genes last
 * changed, then when we retrieved it. It follows the gene catalog contract's
 * provenance line (section 2), but leaves out the assembly, which the page's
 * Assembly row shows, and labels the release date. Fields the annotation
 * doesn't give are left out, and so are the brackets when it gives none of
 * them.
 * @param provenance - The gene's provenance.
 * @returns E.g. "NCBI RefSeq (Community Annotation, RS_2026_09, released
 * 2026-09-18), retrieved 2026-11-03".
 */
export function formatAnnotation(provenance: GeneProvenance): string {
  const {
    genesAsOf,
    provider,
    publisher,
    releaseDate,
    releaseLabel,
    retrievedAt,
  } = provenance;
  const release = [
    provider,
    releaseLabel,
    releaseDate && `released ${releaseDate}`,
  ]
    .filter(Boolean)
    .join(", ");
  const details = [release, genesAsOf && `genes as of ${genesAsOf}`]
    .filter(Boolean)
    .join("; ");
  const retrieved = `retrieved ${formatRetrievedDate(retrievedAt)}`;
  return details
    ? `${publisher} (${details}), ${retrieved}`
    : `${publisher}, ${retrieved}`;
}

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
 * The date of a retrieval time, in UTC.
 * @param retrievedAt - An ISO 8601 date and time, e.g. "2026-11-03T01:27:26Z".
 * @returns E.g. "2026-11-03"; the value as written when it doesn't parse, so
 * the rest of the page still renders.
 */
function formatRetrievedDate(retrievedAt: string): string {
  const date = new Date(retrievedAt);
  if (Number.isNaN(date.getTime())) return retrievedAt;
  return date.toISOString().slice(0, 10);
}

/**
 * A gene type's display name.
 * @param biotype - The gene's type, as NCBI writes it in `gene_biotype`.
 * @returns E.g. "Protein-coding" for "protein_coding"; a type with no display
 * name as written; null when the gene has no type.
 */
export function getGeneTypeName(biotype: string | null): string | null {
  if (!biotype) return null;
  return Object.hasOwn(GENE_TYPE_NAMES, biotype)
    ? GENE_TYPE_NAMES[biotype]
    : biotype;
}

/**
 * A gene's NCBI GeneID, from its aliases.
 * @param aliases - The gene's aliases.
 * @returns E.g. "810891", or null when the gene has none.
 */
export function getNcbiGeneId(aliases: GeneAlias[]): string | null {
  return (
    aliases.find(({ type }) => type === NCBI_GENE_ID_ALIAS_TYPE)?.value ?? null
  );
}

/**
 * A gene's NCBI Gene page.
 * @param geneId - The gene's NCBI GeneID, or null.
 * @returns E.g. "https://www.ncbi.nlm.nih.gov/gene/810891", or null when the
 * gene has no NCBI GeneID.
 */
export function getNcbiGeneUrl(geneId: string | null): string | null {
  return geneId ? `${NCBI_GENE_URL}/${encodeURIComponent(geneId)}` : null;
}

/**
 * A gene's previous IDs, each with the publisher that gave it: the aliases the
 * gene API marks as no longer current, such as old locus tags.
 * @param aliases - The gene's aliases.
 * @returns E.g. ["PF3D7_1217100.2 (NCBI RefSeq)"]; empty when it has none.
 */
export function getPreviousIds(aliases: GeneAlias[]): string[] {
  return aliases
    .filter(({ current }) => !current)
    .map(({ publisher, value }) => `${value} (${publisher})`);
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
