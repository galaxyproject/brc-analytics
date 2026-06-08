import type { ParsedUrlQuery } from "querystring";
import { clearSequencingData } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { UseAssistantHandoff } from "./types";

/**
 * Read the assistant handoff signal from URL query params and shape it into
 * the initial `ConfiguredInput` the stepper mounts with. `isHandoff` is true
 * only for known `dataSource` values ("ena", "upload") so unexpected/garbage
 * input doesn't trigger auto-advance past steps the user hasn't seen.
 * @param query - Parsed URL query from Next.js router.
 * @returns Initial configured input and handoff flag.
 */
export function getInitialConfiguredInputFromQuery(
  query: ParsedUrlQuery
): UseAssistantHandoff {
  const { dataSource } = query;

  if (dataSource === "upload") {
    return {
      initialConfiguredInput: clearSequencingData([]),
      isHandoff: true,
    };
  }

  if (dataSource === "ena") {
    // ENA handoffs have nothing to bake in synchronously — the accessions
    // are fetched and applied asynchronously by useHandoffSync. Start with
    // default empty state.
    return { initialConfiguredInput: undefined, isHandoff: true };
  }

  return { initialConfiguredInput: undefined, isHandoff: false };
}
