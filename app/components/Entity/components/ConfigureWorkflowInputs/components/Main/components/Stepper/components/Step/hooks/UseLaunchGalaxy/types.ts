import { EnaSequencingReads } from "app/utils/galaxy-api/entities";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UcscTrack } from "../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export interface ConfiguredValue {
  geneModelUrl: string | null;
  readRunsPaired: EnaSequencingReads[] | null;
  readRunsSingle: EnaSequencingReads[] | null;
  referenceAssembly: string;
  tracks: UcscTrack[] | null;
}

export interface Status {
  disabled: boolean;
  error: string | null;
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
