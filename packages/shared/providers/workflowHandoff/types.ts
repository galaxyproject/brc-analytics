import { Dispatch } from "react";
import { WorkflowHandoffAction } from "./actions/types";
import { ENTITY_KEYS, SEQUENCING_SOURCE } from "./constants";

/**
 * Known entity key (matches the URL `entityListType` segment).
 */
export type EntityKey = (typeof ENTITY_KEYS)[keyof typeof ENTITY_KEYS];

/**
 * Handoff payload — the pre-configured workflow inputs surfaced from the
 * assistant. Stored keyed by entity+path in the reducer.
 */
export interface HandoffInputs {
  accessions: string[];
  sequencingSource: SEQUENCING_SOURCE | null;
}

/**
 * Context value exposed by the WorkflowInputsView state provider.
 */
export interface WorkflowHandoffContextValue {
  dispatch: Dispatch<WorkflowHandoffAction>;
  state: WorkflowHandoffState;
}

/**
 * Two-level state: entity (URL segment) → path → handoff inputs.
 * Both levels are partial; consumers fall back to `DEFAULT_HANDOFF_INPUTS`.
 */
export type WorkflowHandoffState = Partial<
  Record<EntityKey, Partial<Record<string, HandoffInputs>>>
>;
