import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  Status,
  OnLaunchGalaxy,
} from "./components/Step/hooks/UseLaunchGalaxy/types";
import { GA2AssemblyEntity } from "../../../../../../../../apis/catalog/ga2/entities";
import { StepConfig } from "./components/Step/types";

export interface Props {
  configuredSteps: StepConfig[];
  genome: BRCDataCatalogGenome | GA2AssemblyEntity;
  onConfigure: OnConfigure;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  workflow: Workflow;
}
