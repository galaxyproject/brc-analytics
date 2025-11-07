import { Status } from "../../hooks/UseENADataByTaxonomyId/types";

export interface Props {
  enaTaxonomyIdStatus: Status;
  onContinue: () => void;
  onOpen: () => void;
  readCount?: number;
  selectedCount: number;
  taxonomicLevelSpecies: string;
  taxonomyMatches: number;
}
