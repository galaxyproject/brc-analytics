import { UseQueryResult } from "@tanstack/react-query";
import { BaseReadRun } from "../../types";

export interface Props {
  enaTaxonomyId: UseQueryResult<BaseReadRun[]>;
  onContinue: () => void;
  onOpen: () => void;
  selectedCount: number;
  taxonomicLevelSpecies?: string;
  taxonomyCount?: number;
  taxonomyMatches: number;
}
