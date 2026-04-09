import { ChangeEvent, useCallback, useState } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { DEFAULT_ACCESSION_COUNT } from "../../constants";
import { UseAccessionCount } from "./types";
import { isValid } from "./utils";

/**
 * Hook for managing accession count input state and validation.
 * Maintains a local string value to allow intermediate editing (e.g. empty input),
 * while exposing a parsed numeric value and validity check.
 * @param configuredInput - The current configured input values.
 * @returns Accession count input state, change handler, parsed value, and validity.
 */
export function useAccessionCount(
  configuredInput: ConfiguredInput
): UseAccessionCount {
  const [inputValue, setInputValue] = useState<string>(
    String(configuredInput.numberOfHits ?? DEFAULT_ACCESSION_COUNT)
  );

  const numberOfHits = parseInt(inputValue, 10);

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value);
  }, []);

  return {
    disabled: !isValid(inputValue),
    inputValue,
    numberOfHits,
    onChange,
  };
}
