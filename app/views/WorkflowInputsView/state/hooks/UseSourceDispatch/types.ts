import { SEQUENCING_SOURCE } from "../../constants";

/**
 * Inputs to `onSetSource` (excludes the source key, which the hook supplies).
 */
export interface SetSourceInput {
  accessions: string[];
  sequencingSource: SEQUENCING_SOURCE;
}

/**
 * Return type for the useSourceDispatch hook.
 */
export interface UseSourceDispatch {
  onClearSource: () => void;
  onSetSource: (input: SetSourceInput) => void;
}
