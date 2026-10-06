import type {
  AnalysisSchema,
  LoganContext,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";

export interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

/**
 * A confirmed save of a conversation. Each save is a new object, so a change
 * of identity says another save happened, even of the same session.
 */
export interface LastSave {
  sessionId: string;
}

export interface UseAssistantChatOptions {
  initialLoganJobId?: string;
  initialMessage?: string;
  initialSessionId?: string;
  sessionKey: string;
}

export interface UseAssistantChatReturn {
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
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  shownSessionId: string | null;
  suggestions: SuggestionChip[];
}
