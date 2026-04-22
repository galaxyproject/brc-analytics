import { EnaSequencingReads } from "app/utils/galaxy-api/entities";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  PrimaryContrasts,
} from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UcscTrack } from "../../../../../../../../../../../../utils/ucsc-tracks-api/entities";
import { COLUMN_TYPE } from "../../SampleSheetClassificationStep/types";
import { Strandedness } from "../../StrandednessStep/types";

// Base configured values shared across all scopes
export interface BaseConfiguredValue {
  readRunsPaired: EnaSequencingReads[] | null;
  readRunsSingle: EnaSequencingReads[] | null;
  tracks: UcscTrack[] | null;
}

// ASSEMBLY scope: workflows that operate on a specific genome assembly
export interface AssemblyConfiguredValue extends BaseConfiguredValue {
  _scope: "ASSEMBLY";
  designFormula: string | null;
  geneModelUrl: string | null;
  primaryContrasts: PrimaryContrasts | null;
  referenceAssembly: string;
  sampleSheet: Record<string, string>[] | null;
  sampleSheetClassification: Record<string, COLUMN_TYPE | null> | null;
  strandedness: Strandedness | undefined;
}

// ORGANISM scope: workflows that operate at organism level (may not require specific assembly)
// Organism scope workflows may have collection_spec (defined in workflow YAML) and variables.
// fastaCollection can be either:
// - User-selected assembly accessions (string[]) for user-defined FASTA collections
// - Auto-configured via collection_spec in workflow YAML (handled by Galaxy API)
export interface OrganismConfiguredValue extends BaseConfiguredValue {
  _scope: "ORGANISM";
  fastaCollection: string[] | null;
}

// SEQUENCE scope: workflows that operate on user-provided sequences
export interface SequenceConfiguredValue extends BaseConfiguredValue {
  _scope: "SEQUENCE";
  numberOfHits?: number;
  sequence?: string;
}

// Type guards for ConfiguredValue discrimination
export function isAssemblyConfiguredValue(
  value: ConfiguredValue
): value is AssemblyConfiguredValue {
  return value._scope === "ASSEMBLY";
}

export function isOrganismConfiguredValue(
  value: ConfiguredValue
): value is OrganismConfiguredValue {
  return value._scope === "ORGANISM";
}

export function isSequenceConfiguredValue(
  value: ConfiguredValue
): value is SequenceConfiguredValue {
  return value._scope === "SEQUENCE";
}

// Union type for all configured values
export type ConfiguredValue =
  | AssemblyConfiguredValue
  | OrganismConfiguredValue
  | SequenceConfiguredValue;

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
