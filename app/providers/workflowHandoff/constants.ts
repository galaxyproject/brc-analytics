import { HandoffInputs, WorkflowHandoffState } from "./types";

/**
 * Known entity keys. Matches the `entityListType` segment in the URL path
 * (e.g. `/data/assemblies/...`). State is namespaced by entity so a single
 * handoff payload can be targeted at a specific entity's workflow flow.
 */
export const ENTITY_KEYS = {
  ASSEMBLIES: "assemblies",
} as const;

/**
 * Sequencing-source values a handoff can contribute.
 */
export enum SEQUENCING_SOURCE {
  ENA = "ena",
  UPLOAD = "upload",
}

/**
 * Default handoff payload returned when no entry exists for an
 * entity+path. Deep-frozen so the singleton can't be mutated through
 * shared references.
 */
export const DEFAULT_HANDOFF_INPUTS: HandoffInputs = Object.freeze({
  accessions: Object.freeze([]) as unknown as string[],
  sequencingSource: null,
});

/**
 * Initial state for the WorkflowInputsView reducer. Starts empty; entries
 * are lazily initialised on first dispatch.
 */
export const INITIAL_STATE: WorkflowHandoffState = {};
