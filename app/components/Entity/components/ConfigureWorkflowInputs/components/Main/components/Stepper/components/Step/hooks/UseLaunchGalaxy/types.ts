import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface ConfiguredValue {
  geneModelUrl: string | null;
  pairedEnd: string | null;
  referenceAssembly: string;
}

export interface LaunchStatus {
  disabled: boolean;
  loading: boolean;
}

export type OnLaunch = () => Promise<void>;

export interface Props {
  configuredInput: ConfiguredInput;
  workflow: Workflow;
}

export interface UseLaunchGalaxy {
  launchStatus: LaunchStatus;
  onLaunch: OnLaunch;
}
