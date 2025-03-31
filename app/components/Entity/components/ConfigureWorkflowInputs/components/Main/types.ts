import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  genome: BRCDataCatalogGenome;
  onConfigure: OnConfigure;
  workflow: Workflow;
}
