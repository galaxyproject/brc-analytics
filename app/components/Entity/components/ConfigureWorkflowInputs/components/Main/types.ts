import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { GA2AssemblyEntity } from "../../../../../../apis/catalog/ga2/entities";
import { StepConfig } from "./components/Stepper/components/Step/types";

export interface Props {
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  genome: BRCDataCatalogGenome | GA2AssemblyEntity;
  onConfigure: OnConfigure;
  workflow: Workflow;
}
