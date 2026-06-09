import { useEffect, useMemo } from "react";
import { translateForSequencingStep } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { StepConfig } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { findSequencingStepKey } from "../../sequencing/utils";
import { OnConfigure } from "../UseConfigureInputs/types";
import { Handoff } from "./context";
import { useHandoffEnaQuery } from "./query/ena/hook";
import { buildEnaUpdates } from "./utils";

/**
 * Push resolved handoff query data into the stepper's configured input and
 * return the handoff state for `WorkflowInputsView` to provide via
 * `HandoffContext`.
 *
 * Each query (currently just ENA accessions; future: GTF hints, etc.) fires
 * its own effect that applies data once `ena.data` becomes available. The
 * effect is naturally one-shot: `ena.data` is referentially stable from React
 * Query, `onConfigure` is memoised by `useConfigureInputs`, and the query
 * never refetches within a session (`staleTime: Infinity`).
 *
 * Owns the only call to `useHandoffEnaQuery` so the fetch is bounded to
 * pages that mount this hook — shared step components rendered on other
 * pages don't accidentally trigger handoff fetches against stale state.
 * Loading state for those consumers travels via `HandoffContext.sequencing`.
 *
 * `configuredSteps` is consumed only to derive the sequencing step's key,
 * which controls the array→scalar translation for file-based step
 * workflows. The caller doesn't need to know that detail.
 * @param onConfigure - Stepper input configure callback.
 * @param configuredSteps - Workflow's configured steps.
 * @returns Handoff state to provide via `HandoffContext`.
 */
export const useHandoffSync = (
  onConfigure: OnConfigure,
  configuredSteps: StepConfig[]
): Handoff => {
  const ena = useHandoffEnaQuery();
  const sequencingStepKey = findSequencingStepKey(configuredSteps);

  useEffect(() => {
    // Empty arrays are truthy in JS — guard explicitly so an empty ENA
    // response doesn't clobber existing configuredInput (e.g. the upload
    // signal) with null read-run fields via buildEnaUpdates.
    if (!ena.data || ena.data.length === 0) return;
    onConfigure(
      translateForSequencingStep(buildEnaUpdates(ena.data), sequencingStepKey)
    );
  }, [ena.data, onConfigure, sequencingStepKey]);

  // Memoised so HandoffContext consumers only re-render when isLoading
  // actually changes — not on every parent render.
  return useMemo(
    () => ({ sequencing: { status: { isLoading: ena.isLoading } } }),
    [ena.isLoading]
  );
};
