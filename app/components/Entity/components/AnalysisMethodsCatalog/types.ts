import { ORGANISM_PLOIDY } from "../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export interface Props {
  assemblyPloidy: ORGANISM_PLOIDY | null;
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
}
