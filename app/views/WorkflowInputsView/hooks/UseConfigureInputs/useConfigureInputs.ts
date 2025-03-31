import { useCallback, useState } from "react";
import { ConfiguredInput, UseConfigureInputs } from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({});

  const onConfigure = useCallback((configuredEntry: ConfiguredInput): void => {
    setConfiguredInput((prev) => ({ ...prev, ...configuredEntry }));
  }, []);

  return { configuredInput, onConfigure };
};
