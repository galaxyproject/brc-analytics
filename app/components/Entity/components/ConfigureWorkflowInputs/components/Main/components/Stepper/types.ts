import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  LaunchStatus,
  OnLaunch,
} from "./components/Step/hooks/UseLaunchGalaxy/types";

export interface Props {
  genome: BRCDataCatalogGenome;
  launchStatus: LaunchStatus;
  onConfigure: OnConfigure;
  onLaunch: OnLaunch;
  workflow: Workflow;
}
