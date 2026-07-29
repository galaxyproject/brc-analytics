import { ClearHandoffAction } from "./clearHandoff/types";
import { SetHandoffAction } from "./setHandoff/types";

/**
 * Union of all WorkflowInputsView actions.
 */
export type WorkflowHandoffAction = ClearHandoffAction | SetHandoffAction;

/**
 * Action kind identifiers for the WorkflowInputsView reducer.
 */
export enum WorkflowHandoffActionKind {
  ClearHandoff = "CLEAR_HANDOFF",
  SetHandoff = "SET_HANDOFF",
}
