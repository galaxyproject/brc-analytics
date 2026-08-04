/**
 * QueryKey for the handoff ENA-by-accession query. The second element is a
 * sorted, comma-separated accession list — stable across order variations.
 */
export type QueryKey = ["AssistantHandoffEna", string];
