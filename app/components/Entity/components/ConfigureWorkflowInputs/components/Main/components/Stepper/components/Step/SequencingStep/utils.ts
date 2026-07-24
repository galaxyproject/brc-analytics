import { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { VIEW } from "./components/ToggleButtonGroup/types";

/**
 * Derive the Sequencing step's initial toggle view from `configuredInput`.
 *
 * `[]` on either `readRunsPaired` or `readRunsSingle` is the explicit
 * upload-mode signal (set by `getUploadMyOwnSequencingData`). Anything else
 * (null, undefined, or non-empty arrays) means ENA.
 * @param configuredInput - Current stepper input state.
 * @returns Initial toggle view for the sequencing step.
 */
export function getInitialToggleValue(configuredInput: ConfiguredInput): VIEW {
  if (
    (Array.isArray(configuredInput.readRunsPaired) &&
      configuredInput.readRunsPaired.length === 0) ||
    (Array.isArray(configuredInput.readRunsSingle) &&
      configuredInput.readRunsSingle.length === 0)
  ) {
    return VIEW.UPLOAD_MY_DATA;
  }
  return VIEW.ENA;
}

/**
 * True when all sequencing read-run fields are `undefined` — the signature of
 * a `DEFAULT_CONFIGURED_INPUT` wipe (e.g. assembly re-pick via SelectCell).
 * Distinct from `null` (set by `clearSequencingData()` on user toggle) and
 * from `[]` (the explicit upload signal).
 * @param configuredInput - Current stepper input state.
 * @returns True if every read-run field is undefined.
 */
export function areReadRunsCleared(configuredInput: ConfiguredInput): boolean {
  return (
    configuredInput.readRunsPaired === undefined &&
    configuredInput.readRunsSingle === undefined &&
    configuredInput.readRunPairedFile === undefined &&
    configuredInput.readRunSingleFile === undefined
  );
}

/**
 * Translate a sequencing-input write between array-shaped and file-scalar
 * shaped fields based on which Sequencing step type is active.
 *
 * Array-based steps (`readRunsPaired`, `readRunsSingle`, `readRunsAny`)
 * consume the array fields directly. File-based steps (`readRunPairedFile`,
 * `readRunSingleFile`, introduced by #1314) use single-select tables and
 * consume scalar fields. This function collapses an array write into the
 * appropriate scalar for file-based steps; multi-row inputs are truncated
 * to `runs[0]`.
 *
 * Used by `SequencingStep`'s row-selection callback (so the table's array
 * output ends up in the right field) and by `useHandoffSync` (so the
 * assistant handoff's fetched read-run data lands correctly regardless of
 * the target workflow's step type).
 * @param partial - Partial input update in array-field shape.
 * @param stepKey - Key of the active Sequencing step.
 * @returns Partial input shaped for the target step.
 */
export function translateForSequencingStep(
  partial: Partial<ConfiguredInput>,
  stepKey: string | undefined
): Partial<ConfiguredInput> {
  if (stepKey === "readRunSingleFile") {
    const runs = partial.readRunsSingle;
    if (runs !== undefined) {
      return {
        readRunSingleFile: runs && runs.length > 0 ? runs[0] : null,
        readRunsSingle: null,
      };
    }
  }
  if (stepKey === "readRunPairedFile") {
    const runs = partial.readRunsPaired;
    if (runs !== undefined) {
      return {
        readRunPairedFile: runs && runs.length > 0 ? runs[0] : null,
        readRunsPaired: null,
      };
    }
  }
  return partial;
}
