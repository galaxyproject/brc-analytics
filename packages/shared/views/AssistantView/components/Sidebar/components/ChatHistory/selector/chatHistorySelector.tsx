import { useAuth } from "@repo/shared/providers/authentication/provider";
import { HistoryList } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/historyList";
import { SignInPrompt } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/SignInPrompt/signInPrompt";
import type { ChatHistoryProps } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/types";
import { type JSX } from "react";

/**
 * Selects and renders the chat history content based on auth state.
 *
 * - Auth still resolving: Renders nothing, rather than flashing the sign-in
 *   prompt at a user who is signed in.
 * - Signed out: Displays the prompt to sign in.
 * - Signed in: Displays the user's saved conversations.
 *
 * @param props - Component props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.lastSave - Most recent confirmed save, naming the session saved.
 * @param props.onOpeningChange - Reports whether a conversation is opening from the history.
 * @param props.sessionId - Session of the conversation on screen, or null while none is.
 * @returns The selected chat history content, or null while auth resolves.
 */
export const ChatHistorySelector = ({
  disabled,
  lastSave,
  onOpeningChange,
  sessionId,
}: ChatHistoryProps): JSX.Element | null => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <SignInPrompt />;
  return (
    <HistoryList
      disabled={disabled}
      lastSave={lastSave}
      onOpeningChange={onOpeningChange}
      sessionId={sessionId}
    />
  );
};
