/**
 * Builds the message sent to the assistant when the user clears a field.
 * Worded as the user changing their mind rather than an instruction to clear:
 * the assistant treats the analysis state as system-managed and declines a
 * bare "clear", which leaves the field set.
 * @param label - Field label.
 * @returns Clear message.
 */
export function getClearFieldMessage(label: string): string {
  return `Let's not use that ${label.toLowerCase()}; I'll choose a different one.`;
}

/**
 * Whether a key activates a control, as Enter and Space do a button.
 * @param key - Keyboard event key.
 * @returns True for Enter or Space.
 */
export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}
