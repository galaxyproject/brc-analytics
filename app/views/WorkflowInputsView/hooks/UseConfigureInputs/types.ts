import { EnaSequencingReads } from "app/utils/galaxy-api/entities";

export type OnConfigure = (...p: OnConfigureParams) => void;

/**
 * Possible tuples containing a key and its associated value type.
 */
export type OnConfigureParams = {
  [K in keyof Required<ConfiguredInput>]: [K, ConfiguredInput[K]];
}[keyof ConfiguredInput];

export interface ConfiguredInput {
  geneModelUrl?: string | null;
  readRunsPaired?: EnaSequencingReads[] | null;
  readRunsSingle?: EnaSequencingReads[] | null;
  referenceAssembly?: string;
}

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
