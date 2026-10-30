import type { MouseEvent } from "react";
import type { SuggestionItem, SuggestionsProps } from "./types";

/**
 * Builds the list items for the suggested next steps. Selecting one sends its
 * message as the user's, and the suggestions are hidden while the assistant
 * replies, so focus on the selected row would otherwise be lost. Selected from
 * the keyboard, it moves focus to the composer. Otherwise, as from a screen
 * reader, which reports its clicks as a pointer's, focus still on the row
 * moves to the messages' log instead, so a tap doesn't open the on-screen
 * keyboard; focus elsewhere is left alone. Keyed by position as well as
 * label, as labels aren't guaranteed to be unique.
 * @param suggestions - Suggested next steps.
 * @param onSend - Sends a message to the assistant.
 * @param onFocusComposer - Moves focus to the composer.
 * @param onFocusLog - Moves focus to the messages' log.
 * @returns List items, in the order suggested.
 */
export function buildSuggestionItems(
  suggestions: SuggestionsProps["suggestions"],
  onSend: SuggestionsProps["onSend"],
  onFocusComposer: SuggestionsProps["onFocusComposer"],
  onFocusLog: SuggestionsProps["onFocusLog"]
): SuggestionItem[] {
  return suggestions.map(({ description, label, message }, index) => ({
    description,
    key: `${index}-${label}`,
    label,
    onSelect: (event: MouseEvent<HTMLElement>): void => {
      onSend(message);
      if (isKeyboardClick(event)) onFocusComposer();
      else if (event.currentTarget === document.activeElement) onFocusLog();
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
