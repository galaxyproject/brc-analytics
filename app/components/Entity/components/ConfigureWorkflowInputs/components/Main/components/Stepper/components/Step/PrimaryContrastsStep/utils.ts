import {
  ConfiguredInput,
  PrimaryContrasts,
} from "../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONTRAST_MODE } from "./hooks/UseRadioGroup/types";
import { ContrastPair } from "./hooks/UseExplicitContrasts/types";

/**
 * Builds the primary contrasts configuration based on mode and pairs.
 * @param mode - The selected contrast mode.
 * @param pairs - Valid pairs for explicit mode.
 * @returns PrimaryContrasts configuration object.
 */
export function buildPrimaryContrasts(
  mode: CONTRAST_MODE,
  pairs: ContrastPair[]
): PrimaryContrasts {
  if (mode === CONTRAST_MODE.EXPLICIT) return { pairs, type: mode };

  return { type: mode as CONTRAST_MODE.ALL_AGAINST_ALL };
}

/**
 * Determines if the continue button should be disabled based on mode and validation state.
 * @param mode - The selected contrast mode.
 * @param isExplicitValid - Whether explicit pairs are valid.
 * @returns True if the button should be disabled.
 */
export function isDisabled(
  mode: CONTRAST_MODE,
  isExplicitValid: boolean
): boolean {
  if (mode === CONTRAST_MODE.EXPLICIT) return !isExplicitValid;

  return false;
}

/**
 * Extracts unique values from the primary factor column in the sample sheet.
 * @param configuredInput - Configured input data.
 * @returns Sorted array of unique values.
 */
export function getUniqueFactorValues(
  configuredInput: ConfiguredInput
): string[] {
  const { primaryFactor, sampleSheet } = configuredInput;

  if (!sampleSheet || !primaryFactor) return [];

  const values = new Set<string>();
  for (const row of sampleSheet) {
    const value = row[primaryFactor];
    if (value) values.add(value);
  }

  return [...values].sort();
}
