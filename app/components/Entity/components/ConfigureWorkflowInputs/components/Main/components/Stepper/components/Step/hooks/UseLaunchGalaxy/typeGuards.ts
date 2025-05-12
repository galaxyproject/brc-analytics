/**
 * Returns true if the array contains only strings.
 * @param values - Array of strings or nulls.
 * @returns True if the array contains only strings, false otherwise.
 */
export function isStringArray(values?: (string | null)[]): values is string[] {
  if (!values) return false;
  return values.every((v) => typeof v === "string");
}
