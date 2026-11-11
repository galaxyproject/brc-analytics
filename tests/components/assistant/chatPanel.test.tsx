import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ChatPanel } from "@repo/shared/views/AssistantView/components/ChatPanel/chatPanel";
import type { UseAssistantChatState } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import { render, screen } from "@testing-library/react";
import { type JSX } from "react";
import { chatActions, chatState } from "./chatFixtures";
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

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const TURN = [
  { content: "hi", role: "user" as const },
  { content: "hello back", role: "assistant" as const },
];

// jsdom has no layout engine, so scrollIntoView isn't implemented; the panel
// calls it on its end marker whenever the message list changes and has
// messages in it. Stubbed afresh for each test.
let scrollIntoView: jest.Mock;

function authLoading(): void {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    isConfigured: true,
    isLoading: true,
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
  });
}

/**
 * Builds the panel with a two-message conversation, unsaved and idle.
 * @param state - Chat state to override.
 * @returns The panel element.
 */
function buildPanel(state: Partial<UseAssistantChatState> = {}): JSX.Element {
  return (
    <ChatPanel
      actions={chatActions()}
      introText="Ask away"
      state={chatState({ messages: TURN, ...state })}
    />
  );
}

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

describe("ChatPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    // Signed in unless a test about auth state sets its own.
    signedIn();
  });

  test("does not claim to have saved just because the user is signed in", () => {
    // Signing in does not itself persist anything -- auto-save rides on chat
    // turns. Inferring "saved" from auth state told people their conversation
    // was kept when it was still only in an expiring session.
    signedIn();

    render(buildPanel());

    expect(screen.queryByText("Saved to your account")).not.toBeInTheDocument();
  });

  test("shows the saved hint once the backend confirms the write", () => {
    signedIn();

    render(buildPanel({ isSaved: true }));

    expect(screen.getByText("Saved to your account")).toBeInTheDocument();
  });

  test("does not offer sign-in before auth has resolved", () => {
    // AuthProvider starts signed-out, and the session restore can land before
    // /auth/me does -- which would offer to save a conversation that a
    // signed-in user is already having saved for them.
    authLoading();

    render(buildPanel());

    expect(
      screen.queryByRole("button", {
        name: "Sign in to keep this conversation",
      })
    ).not.toBeInTheDocument();
  });

  test("offers to keep an anonymous conversation", () => {
    signedOut();

    render(buildPanel());

    expect(
      screen.getByRole("button", { name: "Sign in to keep this conversation" })
    ).toBeInTheDocument();
  });

  // With nothing to reveal, a scroll would only move the page; ChatPanel's
  // auto-scroll effect explains when that happens.
  test("doesn't scroll when it mounts with no messages", () => {
    render(buildPanel({ messages: [] }));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  test("scrolls to the latest message when it mounts with messages", () => {
    render(buildPanel());

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  test("scrolls to the latest message each time messages arrive", () => {
    const { rerender } = render(buildPanel({ messages: [] }));

    rerender(buildPanel());
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(
      buildPanel({
        messages: [...TURN, { content: "and now?", role: "user" }],
      })
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  test("doesn't scroll on a re-render with the same messages, or when the conversation is cleared", () => {
    const { rerender } = render(buildPanel());

    rerender(buildPanel({ loading: true }));
    rerender(buildPanel({ messages: [] }));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
