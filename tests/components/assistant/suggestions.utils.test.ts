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
 * @param currentTarget - Row the click was on.
 * @returns The click event.
 */
function click(
  detail: number,
  currentTarget?: HTMLElement
): MouseEvent<HTMLElement> {
  return { currentTarget, detail } as MouseEvent<HTMLElement>;
}

/**
 * Adds a focusable row to the document and focuses it, as a click or a screen
 * reader leaves it.
 * @returns The focused row.
 */
function focusRow(): HTMLElement {
  const row = document.createElement("div");
  row.tabIndex = 0;
  document.body.append(row);
  row.focus();
  return row;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("buildSuggestionItems", () => {
  test("returns no items when there are no suggestions", () => {
    expect(buildSuggestionItems([], jest.fn(), jest.fn(), jest.fn())).toEqual(
      []
    );
  });

  test("keeps each suggestion's label and description, in order", () => {
    const items = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

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
      jest.fn(),
      jest.fn()
    );

    expect(items[0].key).not.toBe(items[1].key);
  });

  test("sends the suggestion's message, not its label", () => {
    const onSend = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      onSend,
      jest.fn(),
      jest.fn()
    );

    item.onSelect(click(1));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("Show me the available assemblies");
  });

  // The suggestions are hidden while the assistant replies, so keyboard focus
  // would otherwise be lost.
  test("moves focus to the composer after a keyboard selection", () => {
    const onFocusComposer = jest.fn();
    const onFocusLog = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      onFocusComposer,
      onFocusLog
    );

    item.onSelect(click(0, focusRow()));

    expect(onFocusComposer).toHaveBeenCalledTimes(1);
    expect(onFocusLog).not.toHaveBeenCalled();
  });

  // A screen reader reports its clicks as a pointer's, and leaves focus on the
  // row, which goes as the assistant replies. Focusing the composer instead
  // would open the on-screen keyboard after a tap.
  test("moves focus to the log after any other selection that left focus on the row", () => {
    const onFocusComposer = jest.fn();
    const onFocusLog = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      onFocusComposer,
      onFocusLog
    );

    item.onSelect(click(1, focusRow()));

    expect(onFocusLog).toHaveBeenCalledTimes(1);
    expect(onFocusComposer).not.toHaveBeenCalled();
  });

  // Nothing is lost when focus is elsewhere, as after a tap in Safari, which
  // doesn't focus what it taps.
  test("leaves focus alone after any other selection that didn't focus the row", () => {
    const onFocusComposer = jest.fn();
    const onFocusLog = jest.fn();
    const [item] = buildSuggestionItems(
      SUGGESTIONS,
      jest.fn(),
      onFocusComposer,
      onFocusLog
    );
    const row = document.createElement("div");
    document.body.append(row);

    item.onSelect(click(1, row));

    expect(onFocusComposer).not.toHaveBeenCalled();
    expect(onFocusLog).not.toHaveBeenCalled();
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
