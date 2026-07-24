import { DEFAULT_HANDOFF_INPUTS } from "@/providers/workflowHandoff/constants";
import { WorkflowHandoffContext } from "@/providers/workflowHandoff/context";
import { EntityKey } from "@/providers/workflowHandoff/types";
import { useContext } from "react";
import { UseHandoffInputs } from "./types";

/**
 * Read the handoff inputs for an entity+path cell, or the default if none
 * exist.
 * @param entity - Entity key (matches URL `entityListType`).
 * @param path - Page path the handoff was emitted for.
 * @returns Handoff inputs for the cell.
 */
export const useHandoffInputs = (
  entity: EntityKey,
  path: string
): UseHandoffInputs => {
  const { state } = useContext(WorkflowHandoffContext);
  return state[entity]?.[path] ?? DEFAULT_HANDOFF_INPUTS;
};
