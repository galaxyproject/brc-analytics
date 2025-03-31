export type OnConfigure = (configuredInput: ConfiguredInput) => void;

export interface ConfigurationEntry {
  label: string;
  values: SelectedValue[];
}

export type ConfiguredInput = Record<string, ConfigurationEntry>;

export interface SelectedValue {
  key: string;
  value: string;
}

export interface UseConfigureInputs {
  configuredInput: ConfiguredInput;
  onConfigure: OnConfigure;
}
