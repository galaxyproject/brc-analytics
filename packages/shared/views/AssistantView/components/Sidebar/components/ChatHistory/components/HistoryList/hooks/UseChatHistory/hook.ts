import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import type { ChatHistoryProps } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OpenError, UseChatHistory } from "./types";
import {
  buildHistoryItems,
  getErrorMessage,
  hasActiveAnalysis,
  openAnalysis,
} from "./utils";

/**
 * Loads the signed-in user's saved conversations and builds the list items
 * that open one in the chat. A new conversation joins the list once it is
 * first saved, without a page reload. Opens nothing while the chat is busy,
 * which includes while another conversation is opening.
 * @param props - Hook props.
 * @param props.disabled - Whether the chat is busy, so switching conversations is blocked.
 * @param props.lastSave - Most recent confirmed save, naming the session saved.
 * @param props.onOpeningChange - Reports whether a conversation is opening from the history.
 * @param props.onRetryRestore - Restores the conversation the URL names again, after a failed load.
 * @param props.sessionId - Session of the conversation on screen, or null while none is.
 * @returns Chat history state and list items.
 */
export const useChatHistory = ({
  disabled,
  lastSave,
  onOpeningChange,
  onRetryRestore,
  sessionId,
}: ChatHistoryProps): UseChatHistory => {
  const {
    error: loadError,
    isLoading,
    items,
    reload,
    setItems,
    // An arrow property on a module-level object, so its identity is stable
    // and useUserResource doesn't refetch on every render.
  } = useUserResource<SavedAnalysisSummary>(apiClient.getSavedAnalyses);
  // Kept with the session showing when it failed: the error is about leaving
  // that conversation, so it goes once another one shows.
  const [openError, setOpenError] = useState<OpenError | null>(null);
  // Only a new save should act from here; the effect also re-runs as the list
  // and auth state change.
  const handledSaveRef = useRef(lastSave);

  useEffect(() => {
    if (lastSave === handledSaveRef.current) return;
    handledSaveRef.current = lastSave;
    if (lastSave === null) return;
    // Only a conversation's first save adds a row. Later saves change nothing
    // the list shows -- the title is fixed when the row is created, and the list
    // is ordered by when each conversation started. Checked against the session
    // saved, not the one showing: a save can land after the user has moved on.
    if (hasActiveAnalysis(items, lastSave.sessionId)) return;
    void reload();
  }, [items, lastSave, reload]);

  const onOpen = useCallback(
    (analysis: SavedAnalysisSummary): void => {
      // The session cookie vouches for one conversation at a time, so a second
      // open, or one mid-reply, would race for it and lock out the loser. An
      // open in flight is part of busy: a click's update is flushed before the
      // next click is handled, so a double-click finds it already set.
      if (disabled) return;
      void openAnalysis(analysis.id, sessionId, {
        onOpeningChange,
        onRetryRestore,
        setItems,
        setOpenError,
      });
    },
    [disabled, onOpeningChange, onRetryRestore, sessionId, setItems]
  );

  const historyItems = useMemo(
    () => buildHistoryItems(items, sessionId, onOpen),
    [items, onOpen, sessionId]
  );

  return {
    error: getErrorMessage(loadError, openError?.sessionId === sessionId),
    isInitialLoading: isLoading && items.length === 0,
    items: historyItems,
  };
};
