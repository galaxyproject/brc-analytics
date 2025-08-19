import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnConfigure } from "../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  Status,
  OnLaunchGalaxy,
} from "./components/Step/hooks/UseLaunchGalaxy/types";

export interface Props {
  genome?: BRCDataCatalogGenome | null;
  onConfigure: OnConfigure;
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
  workflow: Workflow;
}
