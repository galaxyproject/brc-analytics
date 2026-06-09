import { useEffect, useMemo } from "react";
import { translateForSequencingStep } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { StepConfig } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useCurrentPath } from "../../../../hooks/UseCurrentPath/hook";
import { HandoffStatus } from "../../../../providers/workflowHandoff/contexts/HandoffStatus/types";
import { useHandoffDispatch } from "../../../../providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import { EntityKey } from "../../../../providers/workflowHandoff/types";
import { findSequencingStepKey } from "../../sequencing/utils";
import { OnConfigure } from "../UseConfigureInputs/types";
import { useHandoffEnaQuery } from "./query/ena/hook";
import { buildEnaUpdates } from "./utils";

/**
 * Apply the handoff for this entity+path to the stepper's configured input
 * and clear the cell once consumed (single-use semantics).
 *
 * Owns the only call to `useHandoffEnaQuery` so the fetch is bounded to
 * pages that mount this hook. Loading state for shared step components
 * (e.g. `SequencingStep`) travels via `HandoffStatusContext.sequencing`.
 *
 * `configuredSteps` is consumed only to derive the sequencing step's key,
 * which controls the array→scalar translation for file-based step
 * workflows.
 * @param onConfigure - Stepper input configure callback.
 * @param configuredSteps - Workflow's configured steps.
 * @param entity - Entity key (e.g. `assemblies`).
 * @returns Handoff status to provide via `HandoffStatusContext`.
 */
export const useHandoffSync = (
  onConfigure: OnConfigure,
  configuredSteps: StepConfig[],
  entity: EntityKey
): HandoffStatus => {
  const path = useCurrentPath();
  const ena = useHandoffEnaQuery(entity, path);
  const sequencingStepKey = findSequencingStepKey(configuredSteps);
  const { onClearHandoff } = useHandoffDispatch();

  useEffect(() => {
    // Empty arrays are truthy in JS — guard explicitly so an empty ENA
    // response doesn't clobber existing configuredInput (e.g. the upload
    // signal) with null read-run fields via buildEnaUpdates. This same
    // check makes re-firing the effect after `onClearHandoff` a no-op
    // (cleared state → empty accessions → ena.data undefined), and lets
    // a re-dispatched handoff on the same mount apply correctly.
    if (!ena.data || ena.data.length === 0) return;
    onConfigure(
      translateForSequencingStep(buildEnaUpdates(ena.data), sequencingStepKey)
    );
    onClearHandoff({ entity, path });
  }, [ena.data, entity, onClearHandoff, onConfigure, path, sequencingStepKey]);

  // Memoised so HandoffContext consumers only re-render when isLoading
  // actually changes — not on every parent render.
  return useMemo(
    () => ({ sequencing: { status: { isLoading: ena.isLoading } } }),
    [ena.isLoading]
  );
};
