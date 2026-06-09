import { clearSequencingData } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { SEQUENCING_SOURCE } from "../../../../providers/workflowHandoff/constants";
import { HandoffInputs } from "../../../../providers/workflowHandoff/types";
import { UseAssistantHandoff } from "./types";

/**
 * Derive the stepper's initial `ConfiguredInput` from the assistant's handoff
 * inputs. `isHandoff` is true only when a known `sequencingSource` is present
 * so unexpected/garbage values don't trigger auto-advance past steps the
 * user hasn't seen.
 * @param inputs - Handoff inputs for the current entity+path cell.
 * @returns Initial configured input and handoff flag.
 */
export function getInitialConfiguredInput(
  inputs: HandoffInputs
): UseAssistantHandoff {
  const { sequencingSource } = inputs;

  if (sequencingSource === SEQUENCING_SOURCE.UPLOAD) {
    return {
      initialConfiguredInput: clearSequencingData([]),
      isHandoff: true,
    };
  }

  if (sequencingSource === SEQUENCING_SOURCE.ENA) {
    // ENA handoffs have nothing to bake in synchronously — the accessions
    // are fetched and applied asynchronously by useHandoffSync. Start with
    // default empty state.
    return { initialConfiguredInput: undefined, isHandoff: true };
  }

  return { initialConfiguredInput: undefined, isHandoff: false };
}
