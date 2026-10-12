import { useCallback, useState } from "react";
import type { UseConversationKey } from "./types";

/**
 * Returns a key for the conversation panel that changes when the user moves to
 * a different conversation -- starting a new analysis, or opening one from the
 * history -- so the panel starts afresh, unsent draft included. Retrying a
 * restore, or a conversation's own replies, leave it be.
 * @param resetSession - Starts a new conversation.
 * @param setIsOpening - Records whether a conversation is opening from the history.
 * @returns The key, and the sidebar's new analysis and opening handlers.
 */
export const useConversationKey = (
  resetSession: () => void,
  setIsOpening: (isOpening: boolean) => void
): UseConversationKey => {
  const [conversationKey, setConversationKey] = useState(0);

  const onNewAnalysis = useCallback((): void => {
    resetSession();
    setConversationKey((key) => key + 1);
  }, [resetSession]);

  const onOpeningChange = useCallback(
    (isOpening: boolean): void => {
      setIsOpening(isOpening);
      if (isOpening) setConversationKey((key) => key + 1);
    },
    [setIsOpening]
  );

  return { conversationKey, onNewAnalysis, onOpeningChange };
};
