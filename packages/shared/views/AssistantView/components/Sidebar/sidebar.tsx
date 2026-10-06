import { type JSX } from "react";
import { ChatHistory } from "./components/ChatHistory/chatHistory";
import { Footer } from "./components/Footer/footer";
import { Header } from "./components/Header/header";
import { NewAnalysis } from "./components/NewAnalysis/newAnalysis";
import { StyledStack } from "./sidebar.styles";
import type { SidebarProps } from "./types";

/**
 * Assistant sidebar: title, a new analysis action and the user's chat history,
 * with the AI disclaimer and feedback pinned to the bottom.
 * @param props - Component props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.disclaimer - AI disclaimer text.
 * @param props.lastSave - Most recent confirmed save, naming the session saved.
 * @param props.onNewAnalysis - Starts a new conversation.
 * @param props.onOpeningChange - Reports whether a conversation is opening from the history.
 * @param props.sessionId - Session of the conversation on screen, or null while none is.
 * @param props.supportUrl - Feedback form URL; the feedback button is hidden without one.
 * @returns The sidebar element.
 */
export const Sidebar = ({
  disabled,
  disclaimer,
  lastSave,
  onNewAnalysis,
  onOpeningChange,
  sessionId,
  supportUrl,
}: SidebarProps): JSX.Element => {
  return (
    <StyledStack>
      <Header />
      <NewAnalysis disabled={disabled} onNewAnalysis={onNewAnalysis} />
      <ChatHistory
        disabled={disabled}
        lastSave={lastSave}
        onOpeningChange={onOpeningChange}
        sessionId={sessionId}
      />
      <Footer disclaimer={disclaimer} supportUrl={supportUrl} />
    </StyledStack>
  );
};
