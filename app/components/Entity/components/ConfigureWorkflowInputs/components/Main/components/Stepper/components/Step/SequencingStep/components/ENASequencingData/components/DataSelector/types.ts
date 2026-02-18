import { Status } from "../../hooks/UseENADataByTaxonomyId/types";

export interface Props {
  enaTaxonomyIdStatus: Status;
  onContinue: () => void;
  onOpen: () => void;
  selectedCount: number;
  taxonomicLevelSpecies?: string;
  taxonomyCount?: number;
  taxonomyMatches: number;
}
