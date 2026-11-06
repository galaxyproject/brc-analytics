import { type GeneSearchState } from "@repo/shared/hooks/useGeneSearch";

export interface GeneSearchResultsProps {
  query: string;
  search: Exclude<GeneSearchState, { status: "idle" }>;
}
