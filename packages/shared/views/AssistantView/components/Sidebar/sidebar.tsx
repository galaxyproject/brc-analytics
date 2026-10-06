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
 * @param props.disclaimer - AI disclaimer text.
 * @param props.isSaved - Whether the current conversation is saved to the user's account.
 * @param props.onNewAnalysis - Starts a new conversation.
 * @param props.sessionId - Current assistant session id, or null before one is open.
 * @param props.supportUrl - Feedback form URL; the feedback button is hidden without one.
 * @returns The sidebar element.
 */
export const Sidebar = ({
  disclaimer,
  isSaved,
  onNewAnalysis,
  sessionId,
  supportUrl,
}: SidebarProps): JSX.Element => {
  return (
    <StyledStack>
      <Header />
      <NewAnalysis onNewAnalysis={onNewAnalysis} />
      <ChatHistory isSaved={isSaved} sessionId={sessionId} />
      <Footer disclaimer={disclaimer} supportUrl={supportUrl} />
    </StyledStack>
  );
};
