/**
 * Whether a key activates a control, as Enter and Space do a button.
 * @param key - Keyboard event key.
 * @returns True for Enter or Space.
 */
export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}
