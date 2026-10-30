import type { SyntheticEvent } from "react";

/**
 * Whether a key activates a control, as Enter and Space do a button.
 * @param key - Keyboard event key.
 * @returns True for Enter or Space.
 */
export function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/**
 * Whether an event came from the keyboard: an Enter or Space key-down, or the
 * Backspace or Delete key-up on which the chip calls its delete handler, as it
 * also does on a click of its ×.
 * @param event - Event that triggered the clear.
 * @returns True for a key event.
 */
export function isKeyboardEvent(event: SyntheticEvent): boolean {
  return event.type === "keydown" || event.type === "keyup";
}
