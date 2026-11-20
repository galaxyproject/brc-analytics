import { type GeneSearchState } from "@repo/shared/hooks/useGeneSearch";

export interface ExampleGene {
  geneUid: string;
  locusTag: string;
  note: string;
  symbol: string | null;
}

export interface GenesViewProps {
  onSearch: (query: string) => void;
  query: string;
  search: GeneSearchState;
}
