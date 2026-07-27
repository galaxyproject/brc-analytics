import { assistantAPIClient } from "@/services/assistant-api-client";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type {
  AnalysisSchema,
  AssistantChatResponse,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";
import { useCallback, useEffect, useRef, useState } from "react";

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
  initialSessionId?: string;
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * Persists session_id to localStorage and restores on mount; explicit
 * `initialSessionId` from URL params takes precedence over the stored value.
 * @param root0 - Hook options.
 * @param root0.initialSessionId - Existing assistant session to continue.
 * @returns Chat state, sendMessage, save/reset/retry functions.
 */
export const useAssistantChat = ({
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

  // Hydrate from either an explicit initialSessionId (URL param, set by the
  // saved-analysis restore flow) or a localStorage-stored session. URL wins.
  // Either way we call the restore endpoint so we get computed handoff state
  // (handoff_url, is_complete, suggestions), not just messages + schema.
  useEffect(() => {
    const sourceId = initialSessionId ?? localStorage.getItem(SESSION_KEY);
    if (!sourceId) return;

    let cancelled = false;
    // Adopt the id before the round trip. Keeping a pointer through a failed
    // restore is pointless if the next message ignores it -- an unset ref sends
    // session_id: undefined, the server opens a fresh session, and success
    // overwrites the pointer we were trying to protect.
    sessionIdRef.current = sourceId;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    setIsRestoring(true);

    assistantAPIClient
      .assistantRestore(sourceId)
      .then((restored) => {
        if (cancelled) return;
        sessionIdRef.current = restored.session_id;
        localStorage.setItem(SESSION_KEY, restored.session_id);
        setMessages(restored.messages);
        setSchema(restored.schema_state);
        setSuggestions(restored.suggestions);
        setIsComplete(restored.is_complete);
        setHandoffUrl(restored.handoff_url);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = httpStatus(error);
        if (status === 404) {
          // The session reached the end of its life -- aged out on the server's
          // TTL, or dropped. Nothing is broken, and there's nothing to go back
          // to, so drop the id and let the next message open a fresh session.
          sessionIdRef.current = null;
          localStorage.removeItem(SESSION_KEY);
          // A localStorage pointer going stale is unremarkable, so say nothing.
          // An id that arrived on the URL was asked for by name -- that one
          // deserves an answer rather than a blank page.
          if (initialSessionId) {
            setError("That conversation is no longer available.");
          }
          return;
        }
        // Anything else may well be transient with the session still alive on
        // the server, so hold on to the pointer -- dropping it here would turn
        // a blip into permanent loss of the conversation.
        setError("Failed to restore the previous conversation.");
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return (): void => {
      cancelled = true;
    };
  }, [initialSessionId]);

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
      const savedAnalysis = await apiClient.saveAnalysis(sessionIdRef.current);
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
/**
 * Pull the HTTP status off a thrown request error, if it carries one.
 *
 * Duck-typed rather than `instanceof HTTPError`: class identity is one
 * duplicated ky copy or bundling quirk away from failing silently, and the
 * consequence here is a mis-classified restore. Anything without a numeric
 * status -- a network failure, an aborted request -- reports undefined, which
 * every caller treats as the transient case.
 * @param error - The thrown value from a failed request
 * @returns The HTTP status, or undefined if the error doesn't carry one
 */
function httpStatus(error: unknown): number | undefined {
  const response = (error as { response?: { status?: unknown } } | null)
    ?.response;
  return typeof response?.status === "number" ? response.status : undefined;
}

function handleChatError(error: unknown): string {
  const status = httpStatus(error);
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
