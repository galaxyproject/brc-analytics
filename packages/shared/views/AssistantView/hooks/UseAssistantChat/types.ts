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

/**
 * One chat turn: a message, setup-panel fields to clear, or both.
 */
export interface TurnRequest {
  clearFields?: ClearableField[];
  message?: string;
}

/**
 * What the chat can be asked to do.
 */
export interface UseAssistantChatActions {
  onClearField: (field: ClearableField) => Promise<void>;
  onResetSession: () => void;
  /** Retries the failed message or restore; undefined when nothing failed. */
  onRetry?: () => Promise<void>;
  onRetryRestore: () => Promise<void>;
  onSendMessage: (message: string) => Promise<void>;
}

export interface UseAssistantChatOptions {
  initialLoganJobId?: string;
  initialMessage?: string;
  initialSessionId?: string;
  sessionKey: string;
}

export interface UseAssistantChatReturn {
  actions: UseAssistantChatActions;
  state: UseAssistantChatState;
}

/**
 * The conversation on screen and where it stands.
 */
export interface UseAssistantChatState {
  error: string | null;
  handoffUrl: string | null;
  isRestoring: boolean;
  isSaved: boolean;
  lastSave: LastSave | null;
  loading: boolean;
  logan: LoganContext | null;
  messages: ChatMessageDisplay[];
  savedAnalysisId: string | null;
  schema: AnalysisSchema | null;
  shownSessionId: string | null;
  suggestions: SuggestionChip[];
}
