import type { MouseEvent } from "react";
import type { SuggestionItem, SuggestionsProps } from "./types";

/**
 * Builds the list items for the suggested next steps. Selecting one sends its
 * message as the user's. Selected from the keyboard, it then moves focus to
 * the composer, since the selected row is disabled while the assistant
 * replies and focus would otherwise be lost. A pointer or touch selection
 * leaves focus alone, so a tap doesn't open the on-screen keyboard. Keyed by
 * position as well as label, as labels aren't guaranteed to be unique.
 * @param suggestions - Suggested next steps.
 * @param onSend - Sends a message to the assistant.
 * @param onFocusComposer - Moves focus to the composer.
 * @returns List items, in the order suggested.
 */
export function buildSuggestionItems(
  suggestions: SuggestionsProps["suggestions"],
  onSend: SuggestionsProps["onSend"],
  onFocusComposer: SuggestionsProps["onFocusComposer"]
): SuggestionItem[] {
  return suggestions.map(({ description, label, message }, index) => ({
    description,
    key: `${index}-${label}`,
    label,
    onSelect: (event: MouseEvent<HTMLElement>): void => {
      onSend(message);
      if (isKeyboardClick(event)) onFocusComposer();
    },
  }));
}

/**
 * Whether a click came from the keyboard (Enter or Space on a button) rather
 * than a pointer or touch, which report at least one click in `detail`.
 * @param event - Click event.
 * @returns True when the click came from the keyboard.
 */
export function isKeyboardClick(event: MouseEvent<HTMLElement>): boolean {
  return event.detail === 0;
}
