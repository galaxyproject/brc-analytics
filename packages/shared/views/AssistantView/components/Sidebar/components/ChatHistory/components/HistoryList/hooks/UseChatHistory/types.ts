import type { UseAssistantChatActions } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import type { Dispatch, SetStateAction } from "react";

/**
 * A saved conversation as the chat history list renders it.
 */
export interface HistoryItem {
  id: string;
  onOpen: () => void;
  selected: boolean;
  title: string;
}

/**
 * What opens a saved conversation, and where a failure goes.
 */
export interface OpenAnalysisHandlers {
  onOpenConversation: UseAssistantChatActions["onOpenConversation"];
  setOpenError: Dispatch<SetStateAction<OpenError | null>>;
}

/**
 * A failed open, and the session that was showing when it failed.
 */
export interface OpenError {
  sessionId: string | null;
}

/**
 * Return type for the useChatHistory hook.
 */
export interface UseChatHistory {
  error: string | null;
  isInitialLoading: boolean;
  items: HistoryItem[];
}
