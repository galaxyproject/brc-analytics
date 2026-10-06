import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
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
 * What opening a saved conversation reports to as it goes.
 */
export interface OpenAnalysisHandlers {
  onOpeningChange: (isOpening: boolean) => void;
  setItems: Dispatch<SetStateAction<SavedAnalysisSummary[]>>;
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
