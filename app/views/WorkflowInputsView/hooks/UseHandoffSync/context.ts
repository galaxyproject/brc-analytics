import { createContext } from "react";

/**
 * Context value exposed by `WorkflowInputsView`. Areas are siblings so
 * future handoff-derived state (e.g. GTF hints, organism context) can sit
 * next to `sequencing` without consumer churn.
 */
export interface Handoff {
  sequencing: HandoffSequencing;
}

/**
 * Context for handoff state. Provided by `WorkflowInputsView` (the only
 * page that mounts `useHandoffSync`); other pages get the default, so a
 * shared component like `SequencingStep` rendered on those pages reads a
 * non-loading status without firing its own handoff query.
 */
export const HandoffContext = createContext<Handoff>({
  sequencing: { status: { isLoading: false } },
});

/**
 * Handoff state scoped to the sequencing input (the ENA accession fetch).
 */
export interface HandoffSequencing {
  status: HandoffStatus;
}

/**
 * In-flight status of a handoff sub-area.
 */
export interface HandoffStatus {
  isLoading: boolean;
}
