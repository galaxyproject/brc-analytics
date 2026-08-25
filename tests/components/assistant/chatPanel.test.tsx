import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ChatPanel } from "@repo/shared/views/AssistantView/components/ChatPanel/chatPanel";
import { render, screen } from "@testing-library/react";
import { type JSX } from "react";
// jest-dom matchers (toBeInTheDocument) aren't registered globally in this
// repo's jest config; opt in locally as the sibling suites do.
import "@testing-library/jest-dom";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
// ChatMessage pulls in MarkdownContent, which imports rehype-react -- an
// ESM-only package Jest can't parse (same category as the ky stubs in the
// favorites tests). Stub it out; this suite only cares about the panel's
// own chrome, not message rendering.
jest.mock(
  "@repo/shared/views/AssistantView/components/ChatMessage/chatMessage",
  () => ({
    ChatMessage: ({ content }: { content: string }): JSX.Element => (
      <div>{content}</div>
    ),
  })
);

// jsdom has no layout engine, so scrollIntoView isn't implemented; the panel
// calls it on every message-list change via a ref effect.
Element.prototype.scrollIntoView = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function signedIn(): void {
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    isConfigured: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    user: {
      email: "person@example.com",
      name: "Person",
      preferred_username: "person",
      sub: "abc123",
    },
  });
}

const noop = (): void => undefined;

describe("ChatPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not claim to have saved after only the user's own message", () => {
    // A turn isn't complete -- and therefore nothing has been saved -- until
    // a reply comes back. Before that, messages holds just the user's turn.
    signedIn();

    render(
      <ChatPanel
        error={null}
        introText="Ask away"
        loading
        messages={[{ content: "hi", role: "user" }]}
        onSend={noop}
        suggestions={[]}
      />
    );

    expect(screen.queryByText("Saved to your account")).not.toBeInTheDocument();
  });

  test("shows the saved hint once a full turn has completed", () => {
    signedIn();

    render(
      <ChatPanel
        error={null}
        introText="Ask away"
        loading={false}
        messages={[
          { content: "hi", role: "user" },
          { content: "hello back", role: "assistant" },
        ]}
        onSend={noop}
        suggestions={[]}
      />
    );

    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
  });
});
