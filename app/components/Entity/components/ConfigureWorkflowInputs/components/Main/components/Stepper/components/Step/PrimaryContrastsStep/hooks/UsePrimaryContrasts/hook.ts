import { useMemo } from "react";
import { UseBaselineContrasts } from "../UseBaselineContrasts/types";
import { UseExplicitContrasts } from "../UseExplicitContrasts/types";
import { CONTRAST_MODE } from "../UseRadioGroup/types";
import { UsePrimaryContrasts } from "./types";
import { getPrimaryContrasts, isDisabled } from "./utils";

/**
 * Hook for computing the primary contrasts configuration based on mode.
 * @param mode - The contrast mode.
 * @param baselineContrasts - Baseline contrasts.
 * @param explicitContrasts - Explicit contrasts.
 * @returns Primary contrasts state.
 */
export function usePrimaryContrasts(
  mode: CONTRAST_MODE,
  baselineContrasts: UseBaselineContrasts,
  explicitContrasts: UseExplicitContrasts
): UsePrimaryContrasts {
  const { primaryContrasts: baselinePC, valid: isBaselineValid } =
    baselineContrasts;
  const { primaryContrasts: explicitPC, valid: isExplicitValid } =
    explicitContrasts;

  const disabled = useMemo(
    () => isDisabled(mode, isBaselineValid, isExplicitValid),
    [mode, isBaselineValid, isExplicitValid]
  );

  const primaryContrasts = useMemo(
    () => getPrimaryContrasts(mode, baselinePC, explicitPC),
    [mode, baselinePC, explicitPC]
  );

  return {
    disabled,
    primaryContrasts,
  };
}
