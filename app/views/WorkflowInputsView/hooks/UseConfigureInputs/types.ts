import { EnaSequencingReads } from "app/utils/galaxy-api/entities";
import { UcscTrack } from "../../../../utils/ucsc-tracks-api/entities";

export type OnConfigure = (configuredInput: Partial<ConfiguredInput>) => void;

export interface ConfiguredInput {
  geneModelUrl?: string | null;
  readRunsPaired?: EnaSequencingReads[] | null;
  readRunsSingle?: EnaSequencingReads[] | null;
  referenceAssembly?: string;
  sampleSheet?: Record<string, string>[];
  tracks?: UcscTrack[] | null;
}

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
