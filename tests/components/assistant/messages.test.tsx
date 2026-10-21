import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import { Messages } from "@repo/shared/views/AssistantView/components/Conversation/components/Messages/messages";
import type { ChatMessageDisplay } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import { render, screen, within } from "@testing-library/react";
import { type ComponentType, type JSX, type ReactNode } from "react";
// jest-dom matchers aren't registered globally in this repo's jest config; opt
// in locally as the sibling suites do.
import "@testing-library/jest-dom";

// findable-ui's MarkdownRenderer runs a unified/rehype pipeline whose packages
// are ESM-only, which Jest can't parse. Stub it with a renderer that draws a
// reply holding a table through the table component it is given -- falling
// back to a plain table without one -- so these tests check that the assistant
// message wires its own table into the renderer.
jest.mock(
  "@databiosphere/findable-ui/lib/components/MarkdownRenderer/markdownRenderer",
  () => ({
    MarkdownRenderer: ({
      className,
      components,
      value,
    }: {
      className?: string;
      components: Record<string, ComponentType<{ children?: ReactNode }>>;
      value: string;
    }): JSX.Element => {
      if (!value.includes("|"))
        return (
          <div className={className}>
            <p>{value}</p>
          </div>
        );
      const Table = components.table ?? "table";
      return (
        <div className={className}>
          <Table>
            <tbody>
              <tr>
                <td>{value}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      );
    },
  })
);

const ASSISTANT_REPLY =
  "| Category | Details |\n|---|---|\n| Ploidy | Haploid |";
const USER_QUESTION = "**plasmodium** vivax";

const TURN: ChatMessageDisplay[] = [
  { content: USER_QUESTION, role: "user" },
  { content: ASSISTANT_REPLY, role: "assistant" },
];

interface RenderOptions {
  isRestoring?: boolean;
  loading?: boolean;
}

/**
 * Renders the messages list under the app theme, which its narrow-screen
 * styles read breakpoints from.
 * @param messages - Messages in the conversation.
 * @param options - Assistant status.
 * @param options.isRestoring - Whether a conversation is being restored or opened.
 * @param options.loading - Whether a reply to the last message is in flight.
 * @returns The messages log.
 */
function renderMessages(
  messages: ChatMessageDisplay[],
  { isRestoring = false, loading = false }: RenderOptions = {}
): HTMLElement {
  render(
    <ThemeProvider theme={createAppTheme()}>
      <Messages
        error={null}
        introText="Welcome"
        isRestoring={isRestoring}
        loading={loading}
        messages={messages}
      />
    </ThemeProvider>
  );
  return screen.getByRole("log", { name: "Conversation" });
}

/**
 * Asserts the status is the last thing in the log, after every message.
 * @param log - Messages log.
 * @param label - Status text.
 */
function expectStatusAfterMessages(log: HTMLElement, label: string): void {
  const status = within(log).getByText(label);
  expect(log.lastElementChild).toContainElement(status);
  for (const text of [USER_QUESTION, ASSISTANT_REPLY]) {
    const message = within(log).getByText(text, { normalizer: (s) => s });
    expect(
      message.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  }
}

describe("Messages", () => {
  // jsdom has no layout engine and doesn't define scrollTo; the list pins
  // itself to the newest message on every change.
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  afterAll(() => {
    delete (Element.prototype as Partial<Element>).scrollTo;
  });

  test("renders a table in an assistant reply in a labelled, focusable scroll region", () => {
    renderMessages([{ content: ASSISTANT_REPLY, role: "assistant" }]);

    const region = screen.getByRole("region", { name: "Table" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table")).toBeInTheDocument();
  });

  test("renders a user message as typed, not as markdown", () => {
    renderMessages([{ content: USER_QUESTION, role: "user" }]);

    expect(screen.getByText(USER_QUESTION)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Table" })).toBeNull();
  });

  test("names each message's sender for screen readers", () => {
    const log = renderMessages(TURN);

    expect(log).toHaveTextContent(
      /^You:\s*\*\*plasmodium\*\* vivax\s*Assistant:/
    );
  });

  test("renders the app's own note, labelled as a note", () => {
    const log = renderMessages([
      { content: "Organism cleared.", role: "system" },
      ...TURN,
    ]);

    expect(log).toHaveTextContent(/^Note:\s*Organism cleared\.\s*You:/);
  });

  // Opening from the history keeps the old messages on screen until the
  // restore starts; the list is pinned to its end, so the status must be there.
  test("shows the restoring status after the messages", () => {
    const log = renderMessages(TURN, { isRestoring: true });

    expectStatusAfterMessages(log, "Restoring conversation...");
  });

  test("shows the replying status after the messages", () => {
    const log = renderMessages(TURN, { loading: true });

    expectStatusAfterMessages(log, "Thinking...");
  });
});
