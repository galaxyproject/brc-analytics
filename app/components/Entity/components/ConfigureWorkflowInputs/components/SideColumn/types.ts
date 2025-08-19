import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  configuredInput: ConfiguredInput;
  entityListType: string;
  genome?: BRCDataCatalogGenome | null;
  workflow: Workflow;
}
