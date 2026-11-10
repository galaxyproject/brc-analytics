import { useCallback, useState } from "react";
import type { UseConversationKey, UseConversationKeyActions } from "./types";

/**
 * Returns a key for the conversation panel that changes when the user moves to
 * a different conversation -- starting a new analysis, or opening another from
 * the history -- so the panel starts afresh, unsent draft included. A new
 * analysis held off by an open in flight, an open that fails or replaces
 * nothing, a retried restore, and a conversation's own replies leave it be.
 * @param actions - Chat actions.
 * @param actions.onOpenConversation - Opens a saved conversation in place of the one showing.
 * @param actions.onResetSession - Starts a new conversation.
 * @returns The key, and the sidebar's new analysis and open handlers.
 */
export const useConversationKey = ({
  onOpenConversation,
  onResetSession,
}: UseConversationKeyActions): UseConversationKey => {
  const [conversationKey, setConversationKey] = useState(0);
  const onNewAnalysis = useCallback((): void => {
    if (onResetSession()) setConversationKey((key) => key + 1);
  }, [onResetSession]);
  const onOpen = useCallback(
    async (id: string): Promise<boolean> => {
      const opened = await onOpenConversation(id);
      if (opened) setConversationKey((key) => key + 1);
      return opened;
    },
    [onOpenConversation]
  );
  return { conversationKey, onNewAnalysis, onOpenConversation: onOpen };
};
