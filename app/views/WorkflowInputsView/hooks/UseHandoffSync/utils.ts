import type { ParsedUrlQuery } from "querystring";
import {
  mapReadRuns,
  sanitizeReadRuns,
} from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseTable/dataTransforms";
import { BaseReadRun } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { getSequencingData } from "../../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { ConfiguredInput } from "../UseConfigureInputs/types";

/**
 * Translate raw ENA read-run data into a Partial<ConfiguredInput> in the
 * array-field shape. The caller is expected to run this result through
 * `translateForSequencingStep` if the target workflow's sequencing step is
 * file-based.
 * @param data - Raw ENA read-run rows.
 * @returns Partial input update in array-field shape.
 */
export function buildEnaUpdates(data: BaseReadRun[]): Partial<ConfiguredInput> {
  return getSequencingData(sanitizeReadRuns(mapReadRuns(data)));
}

/**
 * Parse the comma-separated `accessions` query param into a sorted string
 * array. Sorting here keeps the React Query cache key stable regardless of
 * the order the assistant emits accessions in.
 * @param query - Parsed URL query from Next.js router.
 * @returns Sorted, de-noised accession strings.
 */
export function extractAccessionsFromQuery(query: ParsedUrlQuery): string[] {
  const { accessions } = query;

  if (typeof accessions !== "string") return [];

  return accessions.split(",").filter(Boolean).sort();
}
