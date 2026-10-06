import { useAuth } from "@repo/shared/providers/authentication/provider";
import { HistoryList } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/historyList";
import { SignInPrompt } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/SignInPrompt/signInPrompt";
import { type JSX } from "react";
import type { ChatHistorySelectorProps } from "./types";

/**
 * Selects and renders the chat history content based on auth state.
 *
 * - Auth still resolving: Renders nothing, rather than flashing the sign-in
 *   prompt at a user who is signed in.
 * - Signed out: Displays the prompt to sign in.
 * - Signed in: Displays the user's saved conversations.
 *
 * @param props - Component props.
 * @param props.isSaved - Whether the current conversation is saved to the user's account.
 * @param props.sessionId - Current assistant session id, or null before one is open.
 * @returns The selected chat history content, or null while auth resolves.
 */
export const ChatHistorySelector = ({
  isSaved,
  sessionId,
}: ChatHistorySelectorProps): JSX.Element | null => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <SignInPrompt />;
  return <HistoryList isSaved={isSaved} sessionId={sessionId} />;
};
