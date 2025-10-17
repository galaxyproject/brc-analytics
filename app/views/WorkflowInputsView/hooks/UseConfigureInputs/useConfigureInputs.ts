import { useCallback, useState } from "react";
import { ConfiguredInput, UseConfigureInputs } from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({});

  const onConfigure = useCallback(
    (configuredInput: Partial<ConfiguredInput>): void => {
      setConfiguredInput((prev) => ({ ...prev, ...configuredInput }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
