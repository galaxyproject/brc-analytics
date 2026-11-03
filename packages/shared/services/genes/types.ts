import type { SOURCE_KIND } from "./constants";

/**
 * The gene snapshot an answer was read from.
 */
export interface GeneSnapshotInfo {
  buildId: string;
  // The provenance database update it was built from; null for the temporary
  // snapshot, which is built straight from a GFF3.
  update: number | null;
}

export interface GeneLocation {
  end: number;
  seqName: string;
  start: number;
  strand: string;
}

export interface GeneOrganism {
  name: string;
  // The species' taxonomy ID, which addresses the organism's page; taxonomyId
  // is the assembly's own taxon, which may be a strain, an isolate or the
  // species itself.
  speciesTaxonomyId: string;
  taxonomyId: string;
}

export interface GeneTranscript {
  // The transcript's GFF3 row ID: unique within the gene, and set even when
  // transcriptId isn't.
  gff3RowId: string;
  location: GeneLocation;
  proteinAccession: string | null;
  // The CDS's product: the protein's name.
  proteinProduct: string | null;
  // Null when the annotation gives none, as for tRNAs and pseudogene
  // transcripts in NCBI's files.
  transcriptId: string | null;
  // The transcript row's product.
  transcriptProduct: string | null;
}

export interface GeneAlias {
  current: boolean;
  publisher: string;
  type: string;
  value: string;
  via: string | null;
}

export interface GeneProvenance {
  annotationSetVersionId: string;
  genesAsOf: string | null;
  provider: string | null;
  publisher: string;
  releaseDate: string | null;
  releaseLabel: string | null;
  retrievedAt: string;
}

export interface Gene {
  aliases: GeneAlias[];
  assemblyAccession: string;
  biotype: string | null;
  geneUid: string;
  location: GeneLocation;
  // The GFF3's `locus_tag` and `Name`, as written; at least one is set. Two
  // genes can share either, so neither identifies a gene: geneUid does.
  locusTag: string | null;
  name: string | null;
  organism: GeneOrganism;
  pageUrl: string;
  provenance: GeneProvenance;
  status: "current" | "not_in_latest";
  symbol: string | null;
  transcripts: GeneTranscript[];
  // The assembly's UCSC Genome Browser address; null when UCSC has no browser
  // for it.
  ucscBrowserUrl: string | null;
}

export interface GeneResponse {
  gene: Gene;
  snapshot: GeneSnapshotInfo;
}

/**
 * One claim BioNym drew from a source: a language model's statement, the quote
 * it rests on, and BioNym's confidence in it, from 0 to 1.
 */
export interface BionymClaim {
  confidence: number;
  quote: string;
  text: string;
}

export type BionymSourceKind = (typeof SOURCE_KIND)[keyof typeof SOURCE_KIND];

/**
 * A paper or dataset BioNym drew claims from.
 */
export interface BionymSource {
  claims: BionymClaim[];
  id: string;
  kind: BionymSourceKind;
  title: string;
  // Null unless the graph gives an https: link.
  url: string | null;
}

/**
 * The claims in a gene's BioNym graph, grouped by source.
 */
export interface BionymClaims {
  geneUid: string;
  // BioNym's input for the graph: the gene's locus tag.
  input: string;
  // The latest date BioNym retrieved evidence on, as YYYY-MM-DD.
  runDate: string;
  sources: BionymSource[];
}
