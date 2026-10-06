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
 * @param sessionId - Current assistant session id, or null before one is open.
 * @param onOpen - Opens a saved conversation in the chat.
 * @returns List items, newest first.
 */
export function buildHistoryItems(
  analyses: SavedAnalysisSummary[],
  sessionId: string | null,
  onOpen: (analysis: SavedAnalysisSummary) => void
): HistoryItem[] {
  return [...analyses].sort(compareNewestFirst).map((analysis) => {
    const selected = isActiveAnalysis(analysis, sessionId);
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
 * Whether the conversation open in the chat is in the list yet.
 * @param analyses - Saved conversations.
 * @param sessionId - Current assistant session id, or null before one is open.
 * @returns True when one of the saved conversations is open in the chat.
 */
export function hasActiveAnalysis(
  analyses: SavedAnalysisSummary[],
  sessionId: string | null
): boolean {
  return analyses.some((analysis) => isActiveAnalysis(analysis, sessionId));
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
 * Opens a saved conversation in the chat, in place of the one showing, and
 * mirrors the backend re-pointing its record at the live session it opened --
 * which selects it without reloading the list. Reports the open as in flight
 * until it settles, and a failure against the session that was showing. When
 * the URL already names the session opened -- one that failed to load -- the
 * navigation changes nothing, so the restore is asked to run again.
 * @param id - Saved conversation id.
 * @param sessionId - Session of the conversation on screen, or null while none is.
 * @param handlers - Where the open reports its progress.
 * @param handlers.onOpeningChange - Reports whether the open is in flight.
 * @param handlers.onRetryRestore - Restores the conversation the URL names again.
 * @param handlers.setItems - Sets the saved conversations.
 * @param handlers.setOpenError - Sets the failed open, if any.
 */
export async function openAnalysis(
  id: string,
  sessionId: string | null,
  {
    onOpeningChange,
    onRetryRestore,
    setItems,
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
    setItems((analyses) => repointAnalysis(analyses, id, liveSessionId));
    if (liveSessionId === requestedSessionId) onRetryRestore();
  } catch {
    setOpenError({ sessionId });
  } finally {
    onOpeningChange(false);
  }
}

/**
 * Points a saved conversation at a new live session -- what the backend does
 * to the record when the conversation is opened.
 * @param analyses - Saved conversations.
 * @param id - Saved conversation to re-point.
 * @param sourceSession - Live session the saved conversation now points at.
 * @returns Saved conversations, with that one re-pointed.
 */
export function repointAnalysis(
  analyses: SavedAnalysisSummary[],
  id: string,
  sourceSession: string
): SavedAnalysisSummary[] {
  return analyses.map((analysis) =>
    analysis.id === id
      ? { ...analysis, source_session: sourceSession }
      : analysis
  );
}
