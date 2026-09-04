/**
 * Maps the assistant's `data_source` schema field onto handoff inputs.
 *
 * Lives with the provider rather than either view because both sides need it:
 * the assistant's SchemaPanel to dispatch a handoff, and the stepper to
 * rehydrate one from a session id in the URL. Keeping it here points both
 * views at the provider instead of at each other.
 */
import type {
  DataSourceDetail,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { SEQUENCING_SOURCE } from "./constants";

/**
 * Parse the backend's structured `data_source.detail`, when it is one.
 * @param detail - Raw detail string from the assistant schema.
 * @returns The parsed detail, or null when absent or not a JSON object.
 */
export function parseDataSourceDetail(
  detail: string | null | undefined
): DataSourceDetail | null {
  if (!detail) return null;
  try {
    const parsed: unknown = JSON.parse(detail);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as DataSourceDetail;
    }
  } catch {
    // Not JSON -- an older session's free-text detail. Fall through.
  }
  return null;
}

/**
 * Whether a parsed value is really a list of strings.
 *
 * `parseDataSourceDetail` only proves the payload is a JSON object; the
 * fields inside it are whatever the backend sent, and the cast to
 * DataSourceDetail is a promise TypeScript cannot keep at runtime.
 *
 * All-or-nothing rather than filtering the bad members out. A list that is
 * partly not accessions means the producer is broken, and half of a broken
 * list is a worse input to a data fetch than falling back to the text the
 * model actually wrote.
 * @param value - Candidate `accessions` field.
 * @returns True when every member is a string.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/**
 * Run accessions for the handoff. The backend resolves them into
 * `data_source.detail` (structured, #1296); the regex over `.value` stays as
 * a fallback for sessions that predate that -- and now also for a detail
 * whose `accessions` is not a list of strings.
 *
 * That guard is not hypothetical tidiness. Without it a detail of
 * `{"accessions": "ERR662077"}` passed both the truthiness and the
 * `.length > 0` check, and spreading a string into a Set handed the stepper
 * `["E","R","6","2","0","7"]` -- six single characters, presented as run
 * accessions, with no error anywhere.
 * @param field - Data-source field from the assistant schema.
 * @returns Run accessions, de-duplicated.
 */
export function extractAccessions(field: SchemaFieldState): string[] {
  const structured = parseDataSourceDetail(field.detail)?.accessions;
  if (isStringArray(structured) && structured.length > 0) {
    return [...new Set(structured)];
  }
  if (!field.value) return [];
  // Require ≥6 digits -- real run accessions are 6-8; loose `\d+` matched
  // "ERR12" mid-sentence and failed downstream.
  return [...new Set(field.value.match(/[ESD]RR\d{6,}/g) ?? [])];
}

// Word-bound to avoid "own" matching "unknown". "user" is included because the
// backend evals observe the LLM emitting it for the upload path.
const UPLOAD_KEYWORDS = /\b(upload|user|own|local)\b/i;

/**
 * Sequencing source for the handoff: the structured detail when present,
 * else the value's keywords. Defaults to ENA, matching the stepper's toggle.
 * @param field - Data-source field from the assistant schema.
 * @returns Normalised sequencing-source key.
 */
export function resolveSequencingSource(
  field: SchemaFieldState
): SEQUENCING_SOURCE {
  const source = parseDataSourceDetail(field.detail)?.source;
  if (source === "upload") return SEQUENCING_SOURCE.UPLOAD;
  if (source === "ena" || source === "logan") return SEQUENCING_SOURCE.ENA;
  if (!field.value) return SEQUENCING_SOURCE.ENA;
  if (UPLOAD_KEYWORDS.test(field.value)) return SEQUENCING_SOURCE.UPLOAD;
  return SEQUENCING_SOURCE.ENA;
}
