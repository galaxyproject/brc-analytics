import { SourceState, WorkflowInputsState } from "./types";

/**
 * Default per-source contribution used when a key has never been written.
 * Deep-frozen so callers reading the default (via `useSourceState` fallback
 * or `clearSourceAction` spread, neither of which clones the inner array)
 * can't accidentally mutate a singleton instance shared across every reader.
 */
export const DEFAULT_SOURCE_STATE: SourceState = Object.freeze({
  accessions: Object.freeze([]) as unknown as string[],
  sequencingSource: null,
});

/**
 * Initial state for the WorkflowInputsView reducer. Starts empty; per-source
 * states are lazily initialised on first access.
 */
export const INITIAL_STATE: WorkflowInputsState = {};

/**
 * Sequencing-source values a source can contribute.
 */
export enum SEQUENCING_SOURCE {
  ENA = "ena",
  UPLOAD = "upload",
}

/**
 * Known source keys. Today the only producer is the assistant; future
 * sources (e.g. shared links, presets) would add their own keys.
 */
export const SOURCE_KEYS = {
  ASSISTANT: "assistant",
} as const;
