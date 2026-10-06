import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";

/**
 * Return type for the useChatHistory hook.
 */
export interface UseChatHistory {
  error: string | null;
  isInitialLoading: boolean;
  items: SavedAnalysisSummary[];
  onOpen: (analysis: SavedAnalysisSummary) => void;
}
