import { type GeneSearchState } from "@repo/shared/hooks/useGeneSearch";

export interface GeneSearchResultsProps {
  search: Exclude<GeneSearchState, { status: "idle" }>;
}
