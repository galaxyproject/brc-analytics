import type {
  AnalysisSchema,
  ChatMessageRole,
  ClearableField,
  LoganContext,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";

export interface ChatMessageDisplay {
  content: string;
  role: ChatMessageRole;
}

/**
 * A confirmed save of a conversation, naming the saved analysis written. Each
 * save is a new object, so a change of identity says another save happened,
 * even of the same analysis.
 */
export interface LastSave {
  savedAnalysisId: string;
}

export interface UseAssistantChatOptions {
  initialLoganJobId?: string;
  initialMessage?: string;
  initialSessionId?: string;
  sessionKey: string;
}

export interface UseAssistantChatReturn {
  clearField: (field: ClearableField) => Promise<void>;
  error: string | null;
  handoffUrl: string | null;
  isComplete: boolean;
  isRestoring: boolean;
  isSaved: boolean;
  lastSave: LastSave | null;
  loading: boolean;
  logan: LoganContext | null;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  resetSession: () => void;
  retryRestore: () => Promise<void>;
  savedAnalysisId: string | null;
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  shownSessionId: string | null;
  suggestions: SuggestionChip[];
}
