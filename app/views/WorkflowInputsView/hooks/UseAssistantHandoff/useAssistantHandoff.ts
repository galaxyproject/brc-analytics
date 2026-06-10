import { useCurrentPath } from "../../../../hooks/UseCurrentPath/hook";
import { useHandoffInputs } from "../../../../providers/workflowHandoff/hooks/UseHandoffInputs/hook";
import { EntityKey } from "../../../../providers/workflowHandoff/types";
import { UseAssistantHandoff } from "./types";
import { getInitialConfiguredInput } from "./utils";

/**
 * Read the assistant→stepper handoff for the current page under the given
 * entity. Path is derived from `router.asPath` (query + fragment stripped) so
 * the caller doesn't have to reconstruct it. Returns the synchronously-
 * derivable initial configured input only; values that require async
 * resolution (e.g. ENA accessions → read-run data) are captured by
 * `useHandoffSync`. Returns blank when no handoff is set for this cell.
 * @param entity - Entity key (e.g. `assemblies`).
 * @returns Initial configured input and handoff flag.
 */
export const useAssistantHandoff = (entity: EntityKey): UseAssistantHandoff => {
  const path = useCurrentPath();
  const inputs = useHandoffInputs(entity, path);
  return getInitialConfiguredInput(inputs);
};
