import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { ERROR_MESSAGE } from "@repo/shared/views/AssistantView/components/Sidebar/components/ChatHistory/components/HistoryList/constants";
import {
  ASSISTANT_QUERY_PARAM,
  UNTITLED_ANALYSIS,
} from "@repo/shared/views/AssistantView/constants";
import { openSavedAnalysis } from "@repo/shared/views/AssistantView/utils";
import Router from "next/router";
import type { HistoryItem, OpenAnalysisHandlers } from "./types";

/**
 * Builds the list items for the saved conversations, newest first by when each
 * was started, marking the one open in the chat as selected. Ordered by start
 * rather than last activity so that opening or continuing a conversation does
 * not move it. Selecting the open one does nothing: it is already showing.
 * @param analyses - Saved conversations.
 * @param savedAnalysisId - Saved analysis the conversation on screen belongs to, or null while it has none.
 * @param onOpen - Opens a saved conversation in the chat.
 * @returns List items, newest first.
 */
export function buildHistoryItems(
  analyses: SavedAnalysisSummary[],
  savedAnalysisId: string | null,
  onOpen: (analysis: SavedAnalysisSummary) => void
): HistoryItem[] {
  return [...analyses].sort(compareNewestFirst).map((analysis) => {
    const selected = analysis.id === savedAnalysisId;
    return {
      id: analysis.id,
      onOpen: (): void => {
        if (!selected) onOpen(analysis);
      },
      selected,
      title: analysis.title ?? UNTITLED_ANALYSIS,
    };
  });
}

/**
 * Orders saved conversations newest first by when each was started.
 * @param a - Saved conversation.
 * @param b - Saved conversation.
 * @returns Negative when a was started after b, positive when before.
 */
export function compareNewestFirst(
  a: SavedAnalysisSummary,
  b: SavedAnalysisSummary
): number {
  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

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
 * Whether a saved conversation is in the list yet.
 * @param analyses - Saved conversations.
 * @param id - Saved conversation id.
 * @returns True when the saved conversation is in the list.
 */
export function hasAnalysis(
  analyses: SavedAnalysisSummary[],
  id: string
): boolean {
  return analyses.some((analysis) => analysis.id === id);
}

/**
 * Opens a saved conversation in the chat, in place of the one showing. It is
 * selected in the list once its restore puts it on screen. Reports the open as
 * in flight until it settles, and a failure against the session that was
 * showing. When the URL already names the session opened -- one that failed to
 * load -- the navigation changes nothing, so the restore is asked to run again.
 * An open that reaches a conversation other than the one showing is reported as
 * such.
 * @param id - Saved conversation id.
 * @param sessionId - Session of the conversation on screen, or null while none is.
 * @param handlers - Where the open reports its progress.
 * @param handlers.onOpened - Reports that a different conversation was reached.
 * @param handlers.onOpeningChange - Reports whether the open is in flight.
 * @param handlers.onRetryRestore - Restores the conversation the URL names again.
 * @param handlers.setOpenError - Sets the failed open, if any.
 */
export async function openAnalysis(
  id: string,
  sessionId: string | null,
  {
    onOpened,
    onOpeningChange,
    onRetryRestore,
    setOpenError,
  }: OpenAnalysisHandlers
): Promise<void> {
  onOpeningChange(true);
  setOpenError(null);
  try {
    // Singleton Router (not useRouter): read once, before the navigation.
    const requestedSessionId = Router.query[ASSISTANT_QUERY_PARAM.SESSION_ID];
    const liveSessionId = await openSavedAnalysis(id, { replace: true });
    // A later navigation won: the page never reached this conversation.
    if (liveSessionId === null) return;
    if (liveSessionId === requestedSessionId) onRetryRestore();
    else if (liveSessionId !== sessionId) onOpened();
  } catch {
    setOpenError({ sessionId });
  } finally {
    onOpeningChange(false);
  }
}
