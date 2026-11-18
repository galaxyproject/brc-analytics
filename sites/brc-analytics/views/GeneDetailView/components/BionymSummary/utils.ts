import { type BionymSummaryStatement } from "@repo/shared/services/genes/types";
import { SUMMARY_MIN_CONFIDENCE } from "./constants";

/**
 * The summary statements shown: those at or above SUMMARY_MIN_CONFIDENCE, in
 * BioNym's order.
 * @param summary - BioNym's summary of the gene.
 * @returns The statements shown.
 */
export function shownStatements(
  summary: BionymSummaryStatement[]
): BionymSummaryStatement[] {
  return summary.filter(
    (statement) => statement.confidence >= SUMMARY_MIN_CONFIDENCE
  );
}

/**
 * The line that counts the summary statements not shown.
 * @param count - How many aren't shown; at least 1.
 * @returns E.g. "4 statements scored below 0.8 aren't shown."
 */
export function describeHidden(count: number): string {
  const [statements, verb] =
    count === 1 ? ["statement", "isn't"] : ["statements", "aren't"];
  return `${count} ${statements} scored below ${SUMMARY_MIN_CONFIDENCE} ${verb} shown.`;
}
