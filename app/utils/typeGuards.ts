/**
 * Returns true if the value is a string.
 * @param value - Value to check.
 * @returns True if the value is a string.
 */
export function isValueString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Returns true if the value is a string or null.
 * @param value - Value to check.
 * @returns True if the value is a string or null.
 */
export function isValueStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}
