import { AnalysisSchema, SchemaFieldState } from "../../../types/api";

/**
 * Build the handoff URL the assistant navigates to. Carries the user's
 * Sequencing-step preference (`dataSource`) and any ENA accessions as
 * query params; assembly + workflow are already in the URL path.
 * @param handoffUrl - Base path emitted by the assistant.
 * @param schema - Filled assistant schema.
 * @param origin - Window origin for URL resolution.
 * @returns Pathname + search string to navigate to.
 */
export function buildHandoffUrl(
  handoffUrl: string,
  schema: AnalysisSchema,
  origin: string
): string {
  const url = new URL(handoffUrl, origin);
  url.searchParams.set(
    "dataSource",
    resolveDataSource(schema.data_source.value)
  );
  const accessions = extractAccessions(schema.data_source);
  if (accessions.length > 0) {
    url.searchParams.set("accessions", accessions.join(","));
  }
  return url.pathname + url.search;
}

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
  return field.value.match(/[ESD]RR\d{6,}/g) ?? [];
}

/**
 * Normalise the LLM's free-text data-source string into "ena" | "upload".
 * Falls back to "ena" for empty/unknown input — matches the stepper's
 * default toggle.
 * @param value - Free-text value from `data_source.value`.
 * @returns Normalised data-source key.
 */
export function resolveDataSource(
  value: string | null | undefined
): "ena" | "upload" {
  if (!value) return "ena";
  const lower = value.toLowerCase();
  if (
    lower.includes("upload") ||
    lower.includes("own") ||
    lower.includes("local")
  ) {
    return "upload";
  }
  return "ena";
}
