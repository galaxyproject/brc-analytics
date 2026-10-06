import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { ERROR_MESSAGE } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/constants";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import Router from "next/router";

/**
 * Picks the message to show for a failed load or open. A failed load wins: it
 * is more fundamental than a failed open.
 * @param loadError - Error from loading the chat history, if any.
 * @param isOpenError - Whether opening a conversation failed.
 * @returns Error message, or null when nothing failed.
 */
export function getErrorMessage(
  loadError: Error | null,
  isOpenError: boolean
): string | null {
  if (loadError) return ERROR_MESSAGE.LOAD;
  if (isOpenError) return ERROR_MESSAGE.OPEN;
  return null;
}

/**
 * Whether a saved conversation is the one open in the chat. The saved record
 * points at the live session it was last saved from.
 * @param analysis - Saved conversation.
 * @param sessionId - Current assistant session id, or null before one is open.
 * @returns True when the saved conversation is open in the chat.
 */
export function isActiveAnalysis(
  analysis: SavedAnalysisSummary,
  sessionId: string | null
): boolean {
  return sessionId !== null && analysis.source_session === sessionId;
}

/**
 * Opens a saved conversation in the chat: the backend restores it into a live
 * session, and the page restores that session when its id lands in the URL.
 * @param id - Saved conversation id.
 */
export async function openAnalysis(id: string): Promise<void> {
  const { session_id } = await apiClient.openSavedAnalysis(id);
  // Singleton Router (not useRouter): nothing reactive to track in deps.
  await Router.push({
    pathname: Router.pathname,
    query: { [ASSISTANT_QUERY_PARAM.SESSION_ID]: session_id },
  });
}

/**
 * Whether the chat history should be reloaded to pick up the current
 * conversation. It is missing from the list when it was saved after the list
 * loaded -- a new conversation's first turn, or one just opened from the list,
 * which the backend re-points at a new live session.
 * @param savedSessionId - Current session id once it is saved, otherwise null.
 * @param reloadedFor - Session id the list was last reloaded for, so a record
 * that never matches can't trigger a reload loop.
 * @param isLoading - Whether the list is loading.
 * @param items - Saved conversations.
 * @returns True when the list should be reloaded.
 */
export function shouldReload(
  savedSessionId: string | null,
  reloadedFor: string | null,
  isLoading: boolean,
  items: SavedAnalysisSummary[]
): boolean {
  if (!savedSessionId || isLoading || savedSessionId === reloadedFor) {
    return false;
  }
  return !items.some((analysis) => isActiveAnalysis(analysis, savedSessionId));
}
