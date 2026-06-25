import { ENAReadRunsQuery } from "../../types";

export interface Props {
  enaTaxonomyId: ENAReadRunsQuery;
  onContinue: () => void;
  onOpen: () => void;
  selectedCount: number;
  taxonomyCount?: number;
  taxonomyMatches: number;
}
