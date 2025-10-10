import { Dispatch, SetStateAction } from "react";
import { ENA_QUERY_METHOD } from "../../../../types";
import { WorkflowParameter } from "app/apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  loading: boolean;
  onContinue: () => void;
  onOpen: () => void;
  readCount?: number;
  selectedCount: number;
  setEnaQueryMethod: Dispatch<SetStateAction<ENA_QUERY_METHOD>>;
  taxonomicLevelSpecies: string;
  workflowParameter?: WorkflowParameter;
}
