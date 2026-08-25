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

function signedOut(): void {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isConfigured: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
  });
}

const noop = (): void => undefined;

const TURN = [
  { content: "hi", role: "user" as const },
  { content: "hello back", role: "assistant" as const },
];

describe("ChatPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not claim to have saved just because the user is signed in", () => {
    // Signing in does not itself persist anything -- auto-save rides on chat
    // turns. Inferring "saved" from auth state told people their conversation
    // was kept when it was still only in an expiring session.
    signedIn();

    render(
      <ChatPanel
        error={null}
        introText="Ask away"
        isSaved={false}
        loading={false}
        messages={TURN}
        onSend={noop}
        suggestions={[]}
      />
    );

    expect(screen.queryByText("Saved to your account")).not.toBeInTheDocument();
  });

  test("shows the saved hint once the backend confirms the write", () => {
    signedIn();

    render(
      <ChatPanel
        error={null}
        introText="Ask away"
        isSaved
        loading={false}
        messages={TURN}
        onSend={noop}
        suggestions={[]}
      />
    );

    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
  });

  test("offers to keep an anonymous conversation", () => {
    signedOut();

    render(
      <ChatPanel
        error={null}
        introText="Ask away"
        isSaved={false}
        loading={false}
        messages={TURN}
        onSend={noop}
        suggestions={[]}
      />
    );

    expect(
      screen.getByRole("button", { name: "Sign in to keep this conversation" })
    ).toBeInTheDocument();
  });
});
