import { useCallback, useState } from "react";
import { ConfiguredInput, UseConfigureInputs } from "./types";

export const useConfigureInputs = (
  initial: ConfiguredInput = {}
): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] =
    useState<ConfiguredInput>(initial);

  const onConfigure = useCallback(
    (nextConfiguredInput: Partial<ConfiguredInput>): void => {
      setConfiguredInput((prev) => ({ ...prev, ...nextConfiguredInput }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
