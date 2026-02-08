import { EnaSequencingReads } from "app/utils/galaxy-api/entities";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  PrimaryContrasts,
} from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UcscTrack } from "../../../../../../../../../../../../utils/ucsc-tracks-api/entities";
import { COLUMN_TYPE } from "../../SampleSheetClassificationStep/types";

export interface ConfiguredValue {
  designFormula: string | null;
  geneModelUrl: string | null;
  primaryContrasts: PrimaryContrasts | null;
  readRunsPaired: EnaSequencingReads[] | null;
  readRunsSingle: EnaSequencingReads[] | null;
  referenceAssembly: string;
  sampleSheet: Record<string, string>[] | null;
  sampleSheetClassification: Record<string, COLUMN_TYPE | null> | null;
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
