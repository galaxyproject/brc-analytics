import { SEQUENCING_SOURCE } from "@/providers/workflowHandoff/constants";
import type { SchemaFieldState } from "@repo/shared/services/api-client/types";

/**
 * Extract ENA/SRA/DDBJ run accessions from the free-text `data_source.value`.
 *
 * The backend doesn't structure accessions into `data_source.detail` (only
 * `assembly` and `workflow` get that treatment in `_apply_schema_updates`),
 * so the LLM stuffs them into `.value` with inconsistent formatting like
 * "ENA (ERR16655350)" or "ENA/SRA — SRR12345678". Regex is the only option
 * until the backend gains structured handling (related: #1296).
 * @param field - Free-text data-source field from the assistant schema.
 * @returns Run accessions found in the field value.
 */
export function extractAccessions(field: SchemaFieldState): string[] {
  if (!field.value) return [];
  // Require ≥6 digits — real ENA/SRA/DDBJ run accessions are typically 6-8.
  // Loose `\d+` would match "ERR12" mid-sentence, which then fails downstream.
  // De-dup so a free-text mention of the same accession twice doesn't fan out
  // into a distinct React Query cache key + duplicated fetch payload.
  return [...new Set(field.value.match(/[ESD]RR\d{6,}/g) ?? [])];
}

// Word-bound to avoid false positives like "own" matching "unknown". "user"
// is included because the backend evals observe the LLM emitting that token
// (e.g. "user upload", "user-provided FASTQs") for the upload path.
const UPLOAD_KEYWORDS = /\b(upload|user|own|local)\b/i;

/**
 * Normalise the LLM's free-text data-source string into a `SEQUENCING_SOURCE`.
 * Falls back to `SEQUENCING_SOURCE.ENA` for empty/unknown input — matches the
 * stepper's default toggle.
 * @param value - Free-text value from the assistant's `data_source.value`.
 * @returns Normalised sequencing-source key.
 */
export function resolveSequencingSource(
  value: string | null | undefined
): SEQUENCING_SOURCE {
  if (!value) return SEQUENCING_SOURCE.ENA;
  if (UPLOAD_KEYWORDS.test(value)) return SEQUENCING_SOURCE.UPLOAD;
  return SEQUENCING_SOURCE.ENA;
}
