import type { SuggestionChip } from "@repo/shared/services/api-client/types";
import {
  buildSuggestionItems,
  isKeyboardClick,
} from "@repo/shared/views/AssistantView/components/Conversation/components/Suggestions/utils";
import type { MouseEvent } from "react";

const SUGGESTIONS: SuggestionChip[] = [
  {
    description: "Find a reference genome for your organism.",
    label: "Explore assemblies",
    message: "Show me the available assemblies",
  },
  { label: "Browse workflows", message: "Which workflows can I run?" },
];

/**
 * Builds a click event as React reports it.
 * @param detail - Click count; 0 for a keyboard click, 1 or more for a pointer.
 * @returns The click event.
 */
function click(detail: number): MouseEvent<HTMLElement> {
  return { detail } as MouseEvent<HTMLElement>;
}

describe("buildSuggestionItems", () => {
  test("returns no items when there are no suggestions", () => {
    expect(buildSuggestionItems([], jest.fn(), jest.fn())).toEqual([]);
  });

  test("keeps each suggestion's label and description, in order", () => {
    const items = buildSuggestionItems(SUGGESTIONS, jest.fn(), jest.fn());

    expect(items.map(({ label }) => label)).toEqual([
      "Explore assemblies",
      "Browse workflows",
    ]);
    expect(items[0].description).toBe(
      "Find a reference genome for your organism."
    );
    expect(items[1].description).toBeUndefined();
  });

  test("keys rows that share a label apart", () => {
    const items = buildSuggestionItems(
      [SUGGESTIONS[1], SUGGESTIONS[1]],
      jest.fn(),
      jest.fn()
    );

    expect(items[0].key).not.toBe(items[1].key);
  });

  test("sends the suggestion's message, not its label", () => {
    const onSend = jest.fn();
    const [item] = buildSuggestionItems(SUGGESTIONS, onSend, jest.fn());

    item.onSelect(click(1));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("Show me the available assemblies");
  });

  // The selected row is disabled while the assistant replies, so keyboard
  // focus would otherwise be lost.
  test("moves focus to the composer after a keyboard selection", () => {
    const onFocusComposer = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      onFocusComposer
    );

    item.onSelect(click(0));

    expect(onFocusComposer).toHaveBeenCalledTimes(1);
  });

  // Focusing the composer after a tap would open the on-screen keyboard.
  test("leaves focus alone after a pointer or touch selection", () => {
    const onFocusComposer = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      onFocusComposer
    );

    item.onSelect(click(1));

    expect(onFocusComposer).not.toHaveBeenCalled();
  });
});

describe("isKeyboardClick", () => {
  test("is true for a click with no click count", () => {
    expect(isKeyboardClick(click(0))).toBe(true);
  });

  test("is false for a single or double pointer click", () => {
    expect(isKeyboardClick(click(1))).toBe(false);
    expect(isKeyboardClick(click(2))).toBe(false);
  });
});
