export type OnConfigure = (
  entryKey: string,
  entryLabel: string,
  values: ConfiguredValue[]
) => void;

export interface ConfigurationEntry {
  entryLabel: string;
  values: ConfiguredValue[];
}

export interface ConfiguredInput {
  [key: string]: ConfigurationEntry;
}

export interface ConfiguredValue {
  key: string | null;
  value: string | null;
}

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
