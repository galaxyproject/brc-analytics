import { MIN_ACCESSION_COUNT } from "../../constants";

/**
 * Checks if a raw input string represents a valid accession count.
 * Requires a positive integer string (no decimals, no trailing characters).
 * @param input - The raw input string.
 * @returns True if the input is a valid positive integer meeting the minimum threshold.
 */
export function isValid(input: string): boolean {
  if (!/^\d+$/.test(input)) return false;
  return parseInt(input, 10) >= MIN_ACCESSION_COUNT;
}
