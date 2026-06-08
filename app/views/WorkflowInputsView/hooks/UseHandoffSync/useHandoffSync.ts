import { useEffect } from "react";
import { translateForSequencingStep } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { StepConfig } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { findSequencingStepKey } from "../../sequencing/utils";
import { OnConfigure } from "../UseConfigureInputs/types";
import { useHandoffEnaQuery } from "./query/ena/hook";
import { buildEnaUpdates } from "./utils";

/**
 * Push resolved handoff query data into the stepper's configured input.
 *
 * Each query (currently just ENA accessions; future: GTF hints, etc.) fires
 * its own effect that applies data once `ena.data` becomes available. The
 * effect is naturally one-shot: `ena.data` is referentially stable from React
 * Query, `onConfigure` is memoised by `useConfigureInputs`, and the query
 * never refetches within a session (`staleTime: Infinity`).
 *
 * `configuredSteps` is consumed only to derive the sequencing step's key,
 * which controls the array→scalar translation for file-based step
 * workflows. The caller doesn't need to know that detail.
 * @param onConfigure - Stepper input configure callback.
 * @param configuredSteps - Workflow's configured steps.
 */
export const useHandoffSync = (
  onConfigure: OnConfigure,
  configuredSteps: StepConfig[]
): void => {
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
};
