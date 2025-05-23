import { useCallback, useState } from "react";
import {
  ConfiguredInput,
  OnConfigureParams,
  UseConfigureInputs,
} from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({});

  const onConfigure = useCallback((...params: OnConfigureParams): void => {
    setConfiguredInput((prev) => configureInput(prev, params[0], params[1]));
  }, []);

  return { configuredInput, onConfigure };
};

function configureInput<K extends keyof ConfiguredInput>(
  configuredInput: ConfiguredInput,
  key: K,
  value: ConfiguredInput[K]
): ConfiguredInput {
  return {
    ...configuredInput,
    [key]: value,
  };
}
