export interface GeneRecord {
  aliases: string[];
  assemblyAccession: string;
  geneId: string;
  geneUid: string;
  location: string;
  organism: string;
  predicted: boolean;
  product: string;
  publisher: string;
  release: string;
  symbol: string;
}

export interface GeneSearchResult {
  gene: GeneRecord;
  matchedAlias: string | null;
}
