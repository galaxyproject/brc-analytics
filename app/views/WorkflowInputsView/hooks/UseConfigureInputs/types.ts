import { EnaSequencingReads } from "app/utils/galaxy-api/entities";
import { UcscTrack } from "../../../../utils/ucsc-tracks-api/entities";
import { COLUMN_TYPE } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

export interface ConfiguredInput {
  designFormula?: string | null;
  geneModelUrl?: string | null;
  primaryContrasts?: PrimaryContrasts | null;
  primaryFactor?: string | null;
  readRunsPaired?: EnaSequencingReads[] | null;
  readRunsSingle?: EnaSequencingReads[] | null;
  referenceAssembly?: string;
  sampleSheet?: Record<string, string>[];
  sampleSheetClassification?: Record<string, COLUMN_TYPE | null>;
  tracks?: UcscTrack[] | null;
}

export interface ExplicitContrasts {
  pairs: [string, string][];
  type: "EXPLICIT";
}

export type OnConfigure = (configuredInput: Partial<ConfiguredInput>) => void;

export type PrimaryContrasts = ExplicitContrasts;

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
