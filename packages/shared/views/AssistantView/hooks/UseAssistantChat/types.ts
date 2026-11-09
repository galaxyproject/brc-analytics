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
 * How a restore treats the session it restores.
 */
export interface RestoreOptions {
  /** Someone asked for this conversation, so losing it is worth saying. */
  isNamed: boolean;
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
  /**
   * Opens a saved conversation in place of the one showing, and names its
   * session in the URL so a reload restores it. Resolves true once it has
   * replaced the conversation showing and its restore is under way, or false
   * when nothing was replaced: it was already showing, or a reply or another
   * open is in flight. Rejects when the server can't open it, leaving the
   * screen as it was.
   */
  onOpenConversation: (id: string) => Promise<boolean>;
  /** Starts a new conversation; false when an open in flight held it off. */
  onResetSession: () => boolean;
  /** Retries the failed message or restore; undefined when nothing failed. */
  onRetry?: () => Promise<void>;
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
  /** A conversation is being restored, or a saved one opened. */
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
