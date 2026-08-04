import { type EnaSequencingReads } from "@repo/shared/utils/galaxy-api/types";
import { type UcscTrack } from "@repo/shared/utils/ucsc-tracks-api/types";
import { type COLUMN_TYPE } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { type Strandedness } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/StrandednessStep/types";

export interface AllVAllContrasts {
  type: "ALL_AGAINST_ALL";
}

export interface BaselineContrasts {
  baseline: string;
  compare: string[];
  type: "BASELINE";
}

export interface ConfiguredInput {
  designFormula?: string | null;
  geneModelUrl?: string | null;
  numberOfHits?: number;
  primaryContrasts?: PrimaryContrasts | null;
  primaryFactor?: string | null;
  readRunPairedFile?: EnaSequencingReads | null;
  readRunSingleFile?: EnaSequencingReads | null;
  readRunsPaired?: EnaSequencingReads[] | null;
  readRunsSingle?: EnaSequencingReads[] | null;
  referenceAssembly?: string;
  sampleSheet?: Record<string, string>[];
  sampleSheetClassification?: Record<string, COLUMN_TYPE | null>;
  sequence?: string;
  sequenceFileName?: string;
  strandedness?: Strandedness;
  tracks?: UcscTrack[] | null;
}

export interface ExplicitContrasts {
  pairs: [string, string][];
  type: "EXPLICIT";
}

export type OnConfigure = (configuredInput: Partial<ConfiguredInput>) => void;

export type PrimaryContrasts =
  | AllVAllContrasts
  | BaselineContrasts
  | ExplicitContrasts;

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
