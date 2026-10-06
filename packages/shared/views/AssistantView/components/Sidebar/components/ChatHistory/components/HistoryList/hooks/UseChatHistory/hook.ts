import { useUserResource } from "@repo/shared/hooks/UseUserResource/hook";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseChatHistory } from "./types";
import {
  getErrorMessage,
  isActiveAnalysis,
  openAnalysis,
  shouldReload,
} from "./utils";

/**
 * Loads the signed-in user's saved conversations and returns the handler that
 * opens one in the chat. Reloads once the current conversation is saved, so a
 * new conversation joins the list without a page reload.
 * @param isSaved - Whether the current conversation is saved to the user's account.
 * @param sessionId - Current assistant session id, or null before one is open.
 * @returns Chat history state and the open handler.
 */
export const useChatHistory = (
  isSaved: boolean,
  sessionId: string | null
): UseChatHistory => {
  const {
    error: loadError,
    isLoading,
    items,
    reload,
    // An arrow property on a module-level object, so its identity is stable
    // and useUserResource doesn't refetch on every render.
  } = useUserResource<SavedAnalysisSummary>(apiClient.getSavedAnalyses);
  const [isOpenError, setIsOpenError] = useState(false);
  const reloadedForRef = useRef<string | null>(null);
  const savedSessionId = isSaved ? sessionId : null;

  useEffect(() => {
    if (
      !shouldReload(savedSessionId, reloadedForRef.current, isLoading, items)
    ) {
      return;
    }
    reloadedForRef.current = savedSessionId;
    void reload();
  }, [isLoading, items, reload, savedSessionId]);

  const onOpen = useCallback(
    (analysis: SavedAnalysisSummary): void => {
      // Already open: reopening would only spin up another live session.
      if (isActiveAnalysis(analysis, sessionId)) return;
      setIsOpenError(false);
      openAnalysis(analysis.id).catch(() => setIsOpenError(true));
    },
    [sessionId]
  );

  return {
    error: getErrorMessage(loadError, isOpenError),
    isInitialLoading: isLoading && items.length === 0,
    items,
    onOpen,
  };
};
