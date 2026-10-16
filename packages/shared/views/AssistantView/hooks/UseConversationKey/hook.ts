import { useCallback, useState } from "react";
import type { UseConversationKey } from "./types";

/**
 * Returns a key for the conversation panel that changes when the user moves to
 * a different conversation -- starting a new analysis, or opening another from
 * the history -- so the panel starts afresh, unsent draft included. An open
 * that fails, loses to a later navigation, or retries the conversation already
 * named, a retried restore, and a conversation's own replies leave it be.
 * @param resetSession - Starts a new conversation.
 * @returns The key, and the sidebar's new analysis and opened handlers.
 */
export const useConversationKey = (
  resetSession: () => void
): UseConversationKey => {
  const [conversationKey, setConversationKey] = useState(0);

  const onNewAnalysis = useCallback((): void => {
    resetSession();
    setConversationKey((key) => key + 1);
  }, [resetSession]);

  const onOpened = useCallback((): void => {
    setConversationKey((key) => key + 1);
  }, []);

  return { conversationKey, onNewAnalysis, onOpened };
};
