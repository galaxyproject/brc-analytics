import { useCallback, useState } from "react";
import { ConfiguredInput, UseConfigureInputs } from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({});

  const onConfigure = useCallback(
    (configuredInput: Partial<ConfiguredInput>): void => {
      if ("referenceAssembly" in configuredInput) {
        // Clear configured input - reference assembly is the first step, so we want to reset all other inputs when it changes.
        setConfiguredInput(configuredInput);
        return;
      }
      setConfiguredInput((prev) => ({ ...prev, ...configuredInput }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
