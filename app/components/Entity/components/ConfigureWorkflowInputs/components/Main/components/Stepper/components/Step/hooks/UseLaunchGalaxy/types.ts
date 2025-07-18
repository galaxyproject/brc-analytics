import { EnaPairedReads } from "app/utils/galaxy-api/entities";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface ConfiguredValue {
  geneModelUrl: string | null;
  readRunsPaired: EnaPairedReads[] | null;
  readRunsSingle: EnaPairedReads[] | null;
  referenceAssembly: string;
}

export interface Status {
  disabled: boolean;
  loading: boolean;
}

export type OnLaunchGalaxy = () => Promise<void>;

export interface Props {
  configuredInput: ConfiguredInput;
  workflow: Workflow;
}

export interface UseLaunchGalaxy {
  onLaunchGalaxy: OnLaunchGalaxy;
  status: Status;
}
