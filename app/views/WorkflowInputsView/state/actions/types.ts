import { ClearSourceAction } from "./clearSource/types";
import { SetSourceAction } from "./setSource/types";

/**
 * Union of all WorkflowInputsView actions.
 */
export type WorkflowInputsAction = ClearSourceAction | SetSourceAction;

/**
 * Action kind identifiers for the WorkflowInputsView reducer.
 */
export enum WorkflowInputsActionKind {
  ClearSource = "CLEAR_SOURCE",
  SetSource = "SET_SOURCE",
}
