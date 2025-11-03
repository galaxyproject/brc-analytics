import { EnaSequencingReads } from "app/utils/galaxy-api/entities";

export type OnConfigure = (configuredInput: Partial<ConfiguredInput>) => void;

export interface ConfiguredInput {
  geneModelUrl?: string | null;
  readRunsPaired?: EnaSequencingReads[] | null;
  readRunsSingle?: EnaSequencingReads[] | null;
  referenceAssembly?: string;
  tracks?: string[] | null;
}

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
