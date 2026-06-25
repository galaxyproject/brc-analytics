/**
 * Determines whether ENA read runs should be pre-fetched for browsing, based on
 * the live read-run count. Pre-fetching only happens when the count is known
 * (not still loading), greater than zero, and under the browse-all cap;
 * otherwise the user enters accessions manually at the ENA picker step.
 * @param count - Live ENA read-run count, or undefined while it is loading.
 * @param maxReadRuns - Maximum read runs eligible for browse-all pre-fetch.
 * @returns True if read runs should be pre-fetched for browsing.
 */
export function isEligible(
  count: number | undefined,
  maxReadRuns: number
): boolean {
  // Eligible only when the count is known, positive, and under the cap. A 0,
  // negative, NaN, or still-loading count falls through to the
  // "Enter Accession(s)" path.
  return count !== undefined && count > 0 && count < maxReadRuns;
}
