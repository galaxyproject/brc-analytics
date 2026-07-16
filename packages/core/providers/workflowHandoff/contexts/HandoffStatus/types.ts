/**
 * In-flight status of a handoff sub-area.
 */
export interface HandoffAreaStatus {
  isLoading: boolean;
}

/**
 * Handoff sub-state scoped to the sequencing input (the ENA accession fetch).
 */
export interface HandoffSequencing {
  status: HandoffAreaStatus;
}

/**
 * Top-level handoff-status context value. Sub-areas are siblings so future
 * handoff-derived state (e.g. GTF hints, organism context) can sit next to
 * `sequencing` without consumer churn.
 */
export interface HandoffStatus {
  sequencing: HandoffSequencing;
}
