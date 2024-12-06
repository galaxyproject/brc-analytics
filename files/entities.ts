export interface SourceGenome {
  accession: string;
  annotationStatus: string;
  chromosomeCount: string;
  coverage: string;
  gcPercent: string;
  geneModelUrl: string;
  isRef: string;
  length: string;
  level: string;
  scaffoldCount: string;
  scaffoldL50: string;
  scaffoldN50: string;
  taxon: string;
  taxonomyId: string;
  ucscBrowser: string;
}

export interface SourceOrganism {
  assemblyCount: string;
  CustomTags: string;
  taxon: string;
  taxonomyId: string;
}
