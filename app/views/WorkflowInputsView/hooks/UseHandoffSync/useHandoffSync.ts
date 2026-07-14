import { translateForSequencingStep } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useCurrentPath } from "@/hooks/UseCurrentPath/hook";
import { SEQUENCING_SOURCE } from "@/providers/workflowHandoff/constants";
import { HandoffStatus } from "@/providers/workflowHandoff/contexts/HandoffStatus/types";
import { useHandoffDispatch } from "@/providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import { useHandoffInputs } from "@/providers/workflowHandoff/hooks/UseHandoffInputs/hook";
import { EntityKey } from "@/providers/workflowHandoff/types";
import { findSequencingStepKey } from "@/views/WorkflowInputsView/sequencing/utils";
import { useEffect, useMemo } from "react";
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
  const { sequencingSource } = useHandoffInputs(entity, path);
  const ena = useHandoffEnaQuery(entity, path);
  const sequencingStepKey = findSequencingStepKey(configuredSteps);
  const { onClearHandoff } = useHandoffDispatch();

  useEffect(() => {
    // No handoff for this cell — nothing to consume.
    if (sequencingSource === null) return;
    // UPLOAD path: the initial input was captured synchronously by
    // `useAssistantHandoff` via `useConfigureInputs`'s `useState`. Just
    // consume the handoff so it doesn't re-apply on a future visit to
    // the same path.
    if (sequencingSource === SEQUENCING_SOURCE.UPLOAD) {
      onClearHandoff({ entity, path });
      return;
    }
    // ENA path. `isLoading` is true only when a first fetch is in flight,
    // so this single check covers both "settled" (success/error/empty data)
    // AND "disabled, never runs" (no accessions to fetch) — they both have
    // `isLoading === false`.
    if (ena.isLoading) return;
    // Apply only when we have non-empty data — `[]` from a settled fetch
    // (no matches / off-taxonomy / etc.) would clobber configuredInput
    // with null read-run fields via buildEnaUpdates. But consume the
    // handoff regardless of outcome so a settled-empty / errored fetch
    // doesn't leave the cell hanging for future visits to retry against.
    if (ena.data && ena.data.length > 0) {
      onConfigure(
        translateForSequencingStep(buildEnaUpdates(ena.data), sequencingStepKey)
      );
    }
    onClearHandoff({ entity, path });
  }, [
    ena.data,
    ena.isLoading,
    entity,
    onClearHandoff,
    onConfigure,
    path,
    sequencingSource,
    sequencingStepKey,
  ]);

  // Memoised so HandoffContext consumers only re-render when isLoading
  // actually changes — not on every parent render.
  return useMemo(
    () => ({ sequencing: { status: { isLoading: ena.isLoading } } }),
    [ena.isLoading]
  );
};
