import {
  AllVAllContrasts,
  BaselineContrasts,
  ExplicitContrasts,
  PrimaryContrasts,
} from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONTRAST_MODE } from "../UseRadioGroup/types";

/**
 * Builds the primary contrasts configuration based on mode.
 * @param mode - Mode.
 * @param baselineContrasts - Baseline contrasts.
 * @param explicitContrasts - Explicit contrasts.
 * @returns PrimaryContrasts configuration object or null if not configured.
 */
export function getPrimaryContrasts(
  mode: CONTRAST_MODE,
  baselineContrasts: BaselineContrasts | null,
  explicitContrasts: ExplicitContrasts | null
): PrimaryContrasts | null {
  switch (mode) {
    case CONTRAST_MODE.ALL_AGAINST_ALL:
      return { type: mode } as AllVAllContrasts;
    case CONTRAST_MODE.BASELINE:
      return baselineContrasts;
    case CONTRAST_MODE.EXPLICIT:
      return explicitContrasts;
  }
}

/**
 * Determines if the continue button should be disabled based on mode and validation state.
 * @param mode - Mode.
 * @param isBaselineValid - Whether baseline is valid.
 * @param isExplicitValid - Whether explicit pairs are valid.
 * @returns True if the button should be disabled.
 */
export function isDisabled(
  mode: CONTRAST_MODE,
  isBaselineValid: boolean,
  isExplicitValid: boolean
): boolean {
  if (mode === CONTRAST_MODE.BASELINE) return !isBaselineValid;
  if (mode === CONTRAST_MODE.EXPLICIT) return !isExplicitValid;
  return false;
}
