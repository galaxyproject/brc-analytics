import { HTTPError } from "ky";
import { useCallback, useEffect, useRef, useState } from "react";
import { assistantAPIClient } from "../services/assistant-api-client";
import { brcAPIClient } from "../services/brc-api-client";
import {
  AnalysisSchema,
  AssistantChatResponse,
  SavedAnalysisDetail,
  SuggestionChip,
} from "../types/api";

const SESSION_KEY = "brc-assistant-session-id";

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface UseAssistantChatReturn {
  error: string | null;
  handoffUrl: string | null;
  isComplete: boolean;
  isRestoring: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  resetSession: () => void;
  saveAnalysis: () => Promise<void>;
  saveLoading: boolean;
  saveMessage: string | null;
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  suggestions: SuggestionChip[];
}

interface UseAssistantChatOptions {
  initialSavedAnalysisId?: string;
  initialSessionId?: string;
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * Persists session_id to localStorage and restores on mount; explicit
 * `initialSessionId` from URL params takes precedence over the stored value.
 * @param root0 - Hook options.
 * @param root0.initialSavedAnalysisId - Saved analysis to hydrate into the chat.
 * @param root0.initialSessionId - Existing assistant session to continue.
 * @returns Chat state, sendMessage, save/reset/retry functions.
 */
export const useAssistantChat = ({
  initialSavedAnalysisId,
  initialSessionId,
}: UseAssistantChatOptions = {}): UseAssistantChatReturn => {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([]);
  const [schema, setSchema] = useState<AnalysisSchema | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  const sendingRef = useRef(false);

  // Sync the session ref when caller swaps initialSessionId.
  useEffect(() => {
    if (initialSessionId !== undefined) {
      sessionIdRef.current = initialSessionId;
    }
  }, [initialSessionId]);

  // Restore last session from localStorage on mount, unless an explicit
  // initialSessionId was provided (URL > localStorage).
  useEffect(() => {
    if (initialSessionId) return;
    const storedId = localStorage.getItem(SESSION_KEY);
    if (!storedId) return;

    let cancelled = false;
    setIsRestoring(true);

    assistantAPIClient
      .assistantRestore(storedId)
      .then((restored) => {
        if (cancelled) return;
        sessionIdRef.current = restored.session_id;
        setMessages(restored.messages);
        setSchema(restored.schema_state);
        setSuggestions(restored.suggestions);
        setIsComplete(restored.is_complete);
        setHandoffUrl(restored.handoff_url);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(SESSION_KEY);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return (): void => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  // Hydrate the chat from a saved analysis when one is requested via URL.
  useEffect(() => {
    if (!initialSavedAnalysisId) return;

    let isMounted = true;
    setError(null);

    brcAPIClient
      .getSavedAnalysis(initialSavedAnalysisId)
      .then((savedAnalysis: SavedAnalysisDetail) => {
        if (!isMounted) return;
        setMessages(savedAnalysis.messages);
        setSchema(savedAnalysis.schema);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Failed to restore the saved analysis.");
      });

    return (): void => {
      isMounted = false;
    };
  }, [initialSavedAnalysisId]);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim() || sendingRef.current) return;
    sendingRef.current = true;

    setLoading(true);
    setError(null);
    setLastFailedMessage(null);
    setSaveMessage(null);

    // Add user message immediately for responsiveness
    setMessages((prev) => [...prev, { content: message, role: "user" }]);

    try {
      const response: AssistantChatResponse =
        await assistantAPIClient.assistantChat({
          message,
          session_id: sessionIdRef.current ?? undefined,
        });

      sessionIdRef.current = response.session_id;
      localStorage.setItem(SESSION_KEY, response.session_id);

      // Add assistant reply
      setMessages((prev) => [
        ...prev,
        { content: response.reply, role: "assistant" },
      ]);

      setSchema(response.schema_state);
      setSuggestions(response.suggestions);
      setIsComplete(response.is_complete);
      setHandoffUrl(response.handoff_url);
    } catch (err) {
      const errorMessage = handleChatError(err);
      setError(errorMessage);
      setLastFailedMessage(message);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastFailedMessage) return;
    const msg = lastFailedMessage;
    setLastFailedMessage(null);
    setError(null);
    setMessages((prev) => prev.slice(0, -1));
    await sendMessage(msg);
  }, [lastFailedMessage, sendMessage]);

  const resetSession = useCallback((): void => {
    const oldId = sessionIdRef.current;
    if (oldId) {
      assistantAPIClient.assistantDeleteSession(oldId).catch(() => {});
    }
    sessionIdRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setSchema(null);
    setSuggestions([]);
    setIsComplete(false);
    setHandoffUrl(null);
    setError(null);
    setLastFailedMessage(null);
    setSaveMessage(null);
  }, []);

  const saveAnalysis = useCallback(async (): Promise<void> => {
    if (!sessionIdRef.current) {
      setSaveMessage("There is no active assistant session to save.");
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);
    try {
      const savedAnalysis = await brcAPIClient.saveAnalysis(
        sessionIdRef.current
      );
      setSaveMessage(
        savedAnalysis.title ? `Saved: ${savedAnalysis.title}` : "Saved."
      );
    } catch {
      setSaveMessage("Failed to save this analysis.");
    } finally {
      setSaveLoading(false);
    }
  }, []);

  return {
    error,
    handoffUrl,
    isComplete,
    isRestoring,
    loading,
    messages,
    onRetry: lastFailedMessage ? retry : undefined,
    resetSession,
    saveAnalysis,
    saveLoading,
    saveMessage,
    schema,
    sendMessage,
    suggestions,
  };
};

/**
 * Map API errors to user-friendly messages.
 * @param error - The caught error
 * @returns A user-facing error string
 */
function handleChatError(error: unknown): string {
  const status =
    error instanceof HTTPError ? error.response?.status : undefined;
  const name = (error as { name?: string }).name;
  if (name === "TimeoutError" || status === 504) {
    return "The assistant took too long to respond. Please try again.";
  } else if (status === 503) {
    return "The analysis assistant is currently unavailable. Please try again later.";
  } else if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}
