import { useCallback, useRef, useState } from "react";
import { ConfiguredInput, UseConfigureInputs } from "./types";

export const useConfigureInputs = (
  initial: ConfiguredInput = {}
): UseConfigureInputs => {
  const initialRef = useRef(initial);
  const hasMergedInitialRef = useRef(false);
  const [configuredInput, setConfiguredInput] =
    useState<ConfiguredInput>(initial);

  const onConfigure = useCallback(
    (configuredInput: Partial<ConfiguredInput>): void => {
      if ("referenceAssembly" in configuredInput) {
        // Reference assembly is the first step. The FIRST time it's set
        // (ReferenceAssemblyStep's mount-time effect), merge with initial
        // state to preserve handoff signals (e.g. upload mode). On
        // subsequent user-driven changes, fall back to the original
        // "wipe everything else" behaviour so swapping assembly mid-flow
        // doesn't resurrect a stale handoff signal the user has moved past.
        if (!hasMergedInitialRef.current) {
          hasMergedInitialRef.current = true;
          setConfiguredInput({ ...initialRef.current, ...configuredInput });
        } else {
          setConfiguredInput(configuredInput);
        }
        return;
      }
      setConfiguredInput((prev) => ({ ...prev, ...configuredInput }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
