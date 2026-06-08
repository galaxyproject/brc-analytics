import { clearSequencingData } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { SEQUENCING_SOURCE } from "../../state/constants";
import { SourceState } from "../../state/types";
import { UseAssistantHandoff } from "./types";

/**
 * Derive the stepper's initial `ConfiguredInput` from the assistant's handoff
 * state. `isHandoff` is true only when a known `sequencingSource` is present
 * so unexpected/garbage values don't trigger auto-advance past steps the user
 * hasn't seen.
 * @param handoff - Current contribution from the assistant source.
 * @returns Initial configured input and handoff flag.
 */
export function getInitialConfiguredInput(
  handoff: SourceState
): UseAssistantHandoff {
  const { sequencingSource } = handoff;

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
