import { useCallback, useState } from "react";
import { ConfiguredInput, ConfiguredValue, UseConfigureInputs } from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({});

  const onConfigure = useCallback(
    (entryKey: string, entryLabel: string, values: ConfiguredValue[]): void => {
      setConfiguredInput((prev) => ({
        ...prev,
        [entryKey]: { entryLabel, values },
      }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
