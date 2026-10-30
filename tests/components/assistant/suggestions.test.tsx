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
  isBusy?: boolean;
  isSetupComplete?: boolean;
  onFocusComposer?: jest.Mock;
  onFocusLog?: jest.Mock;
  onSend?: jest.Mock;
  suggestions?: SuggestionChip[];
}

/**
 * Renders the suggested next steps, under the app theme its narrow-screen
 * styles read breakpoints from.
 * @param options - Props to override.
 * @param options.isBusy - Whether the assistant is busy.
 * @param options.isSetupComplete - Whether the setup is complete and ready to hand off.
 * @param options.onFocusComposer - Moves focus to the composer.
 * @param options.onFocusLog - Moves focus to the messages' log.
 * @param options.onSend - Sends a message to the assistant.
 * @param options.suggestions - Suggested next steps.
 * @returns The render's container.
 */
function renderSuggestions({
  isBusy = false,
  isSetupComplete = false,
  onFocusComposer = jest.fn(),
  onFocusLog = jest.fn(),
  onSend = jest.fn(),
  suggestions = SUGGESTIONS,
}: RenderOptions = {}): HTMLElement {
  const { container } = render(
    <Suggestions
      isBusy={isBusy}
      isSetupComplete={isSetupComplete}
      onFocusComposer={onFocusComposer}
      onFocusLog={onFocusLog}
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
  // jsdom applies no media queries, so this is the wide-screen layout; hiding
  // them on narrow screens is covered by the assistant e2e suite.
  test("keeps the suggestions on wide screens once the setup is complete", () => {
    renderSuggestions({ isSetupComplete: true });
    expect(screen.getByRole("list", { name: HEADING })).toBeVisible();
  });

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

  // Until the assistant's reply arrives, the suggestions belong to the one
  // before it.
  test("renders nothing while the assistant is busy", () => {
    const container = renderSuggestions({ isBusy: true });

    expect(container).toBeEmptyDOMElement();
  });
});
