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
  taxonomyId: string;
}

export interface GeneTranscript {
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
}

export interface GeneResponse {
  gene: Gene;
  snapshot: GeneSnapshotInfo;
}
