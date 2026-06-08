import { Dispatch } from "react";
import { WorkflowInputsAction } from "./actions/types";
import { SEQUENCING_SOURCE, SOURCE_KEYS } from "./constants";

/**
 * Known source key (currently only the assistant).
 */
export type SourceKey = (typeof SOURCE_KEYS)[keyof typeof SOURCE_KEYS];

/**
 * Per-source payload contribution.
 */
export interface SourceState {
  accessions: string[];
  sequencingSource: SEQUENCING_SOURCE | null;
}

/**
 * Context value exposed by the WorkflowInputsView state provider.
 */
export interface WorkflowInputsContextValue {
  dispatch: Dispatch<WorkflowInputsAction>;
  state: WorkflowInputsState;
}

/**
 * State mapping source keys to their contribution. Entries are lazily
 * initialised; consumers should fall back to `DEFAULT_SOURCE_STATE`.
 */
export type WorkflowInputsState = Partial<Record<SourceKey, SourceState>>;
