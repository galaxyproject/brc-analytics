import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import type { SuggestionChip } from "@repo/shared/services/api-client/types";
import {
  HEADING,
  TYPE_SOMETHING_ELSE,
} from "@repo/shared/views/AssistantView/components/Conversation/components/Suggestions/constants";
import { Suggestions } from "@repo/shared/views/AssistantView/components/Conversation/components/Suggestions/suggestions";
import { fireEvent, render, screen } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config; opt
// in locally as the sibling suites do.
import "@testing-library/jest-dom";

const DESCRIPTION = "Find a reference genome for your organism.";

const SUGGESTIONS: SuggestionChip[] = [
  {
    description: DESCRIPTION,
    label: "Explore assemblies",
    message: "Show me the available assemblies",
  },
  { label: "Browse workflows", message: "Which workflows can I run?" },
];

interface RenderOptions {
  disabled?: boolean;
  onFocusComposer?: jest.Mock;
  onSend?: jest.Mock;
  suggestions?: SuggestionChip[];
}

/**
 * Renders the suggested next steps, under the app theme its narrow-screen
 * styles read breakpoints from.
 * @param options - Props to override.
 * @param options.disabled - Whether the assistant is busy.
 * @param options.onFocusComposer - Moves focus to the composer.
 * @param options.onSend - Sends a message to the assistant.
 * @param options.suggestions - Suggested next steps.
 * @returns The render's container.
 */
function renderSuggestions({
  disabled = false,
  onFocusComposer = jest.fn(),
  onSend = jest.fn(),
  suggestions = SUGGESTIONS,
}: RenderOptions = {}): HTMLElement {
  const { container } = render(
    <Suggestions
      disabled={disabled}
      isSetupComplete={false}
      onFocusComposer={onFocusComposer}
      onSend={onSend}
      suggestions={suggestions}
    />,
    {
      wrapper: ({ children }) => (
        <ThemeProvider theme={createAppTheme()}>{children}</ThemeProvider>
      ),
    }
  );
  return container;
}

/**
 * Finds a row's button by the text it shows.
 * @param text - Text in the row.
 * @returns The row's button.
 */
function getRow(text: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${text}`) });
}

describe("Suggestions", () => {
  test("renders nothing when there are no suggestions", () => {
    const container = renderSuggestions({ suggestions: [] });

    expect(container).toBeEmptyDOMElement();
  });

  test("lists the suggestions under the heading, then 'Type something else...'", () => {
    renderSuggestions();

    const list = screen.getByRole("list", { name: HEADING });
    expect(list).toBeInTheDocument();
    expect(
      screen.getAllByRole("button").map(({ textContent }) => textContent)
    ).toEqual([
      `Explore assemblies${DESCRIPTION}`,
      "Browse workflows",
      TYPE_SOMETHING_ELSE,
    ]);
  });

  test("sends a row's message when it is clicked", () => {
    const onSend = jest.fn();
    renderSuggestions({ onSend });

    fireEvent.click(getRow("Browse workflows"), { detail: 1 });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("Which workflows can I run?");
  });

  test("moves focus to the composer from 'Type something else...'", () => {
    const onFocusComposer = jest.fn();
    const onSend = jest.fn();
    renderSuggestions({ onFocusComposer, onSend });

    fireEvent.click(getRow(TYPE_SOMETHING_ELSE), { detail: 1 });

    expect(onFocusComposer).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });

  // MUI blocks pointer clicks on a disabled row with CSS, which jsdom doesn't
  // apply, so this checks each row is marked disabled and out of the tab order
  // rather than clicking it.
  test("disables every row while the assistant is busy", () => {
    renderSuggestions({ disabled: true });

    for (const label of [
      "Explore assemblies",
      "Browse workflows",
      TYPE_SOMETHING_ELSE,
    ]) {
      const row = getRow(label);
      expect(row).toHaveAttribute("aria-disabled", "true");
      expect(row).toHaveAttribute("tabindex", "-1");
    }
  });
});
