import { useCallback, useEffect, useRef, useState } from "react";
import { llmAPIClient } from "../services/llm-api-client";
import {
  AnalysisSchema,
  AssistantChatResponse,
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
  onRetry: (() => Promise<void>) | null;
  resetSession: () => void;
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  suggestions: SuggestionChip[];
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * Persists session_id to localStorage and restores on mount.
 * @returns Chat state, sendMessage, resetSession, and retry functions
 */
export const useAssistantChat = (): UseAssistantChatReturn => {
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
  const sessionIdRef = useRef<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem(SESSION_KEY);
    if (!storedId) return;

    let cancelled = false;
    setIsRestoring(true);

    llmAPIClient
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
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setLastFailedMessage(null);

    // Add user message immediately for responsiveness
    setMessages((prev) => [...prev, { content: message, role: "user" }]);

    try {
      const response: AssistantChatResponse = await llmAPIClient.assistantChat({
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
    }
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastFailedMessage) return;
    const msg = lastFailedMessage;
    setLastFailedMessage(null);
    setError(null);
    // Remove the failed user message -- sendMessage will re-add it
    setMessages((prev) => prev.slice(0, -1));
    await sendMessage(msg);
  }, [lastFailedMessage, sendMessage]);

  const resetSession = useCallback((): void => {
    const oldId = sessionIdRef.current;
    if (oldId) {
      llmAPIClient.assistantDeleteSession(oldId).catch(() => {});
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
  }, []);

  return {
    error,
    handoffUrl,
    isComplete,
    isRestoring,
    loading,
    messages,
    onRetry: lastFailedMessage ? retry : null,
    resetSession,
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
  const err = error as { message?: string; name?: string };
  if (err.name === "TimeoutError") {
    return "The assistant took too long to respond. Please try again.";
  } else if (err.message?.includes("503")) {
    return "The analysis assistant is currently unavailable. Please try again later.";
  } else if (err.message?.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}
