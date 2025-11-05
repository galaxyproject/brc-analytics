import { Dispatch, SetStateAction } from "react";
import { ENA_QUERY_METHOD } from "../../../../types";
import { Status } from "../../hooks/UseENADataByTaxonomyId/types";

export interface Props {
  enaTaxonomyIdStatus: Status;
  onContinue: () => void;
  onOpen: () => void;
  readCount?: number;
  selectedCount: number;
  setEnaQueryMethod: Dispatch<SetStateAction<ENA_QUERY_METHOD>>;
  taxonomicLevelSpecies: string;
}
