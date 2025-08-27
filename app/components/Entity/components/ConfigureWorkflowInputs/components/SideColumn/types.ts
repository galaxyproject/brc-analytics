import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { GA2AssemblyEntity } from "../../../../../../apis/catalog/ga2/entities";

export interface Props {
  configuredInput: ConfiguredInput;
  genome: BRCDataCatalogGenome | GA2AssemblyEntity;
  workflow: Workflow;
}
