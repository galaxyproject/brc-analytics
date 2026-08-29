import { apiClient } from "@repo/shared/services/api-client/api-client";
import type {
  AnalysisSchema,
  AssistantChatResponse,
  LoganContext,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

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
  logan: LoganContext | null;
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
  initialLoganJobId?: string;
  initialMessage?: string;
  initialSessionId?: string;
  sessionKey: string;
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * Persists session_id to localStorage and restores on mount; explicit
 * `initialSessionId` from URL params takes precedence over the stored value.
 * An `initialMessage` opens a new conversation with that question instead, and
 * `initialLoganJobId` outranks both -- it opens a new conversation bound to
 * that search, which is the more specific intent when a person has just
 * clicked through from a cohort.
 * @param root0 - Hook options.
 * @param root0.initialLoganJobId - Logan job to open a new session from.
 * @param root0.initialMessage - Question to open a new conversation with.
 * @param root0.initialSessionId - Existing assistant session to continue.
 * @param root0.sessionKey - localStorage key under which the session id is stored.
 * @returns Chat state, sendMessage, save/reset/retry functions.
 */
export const useAssistantChat = ({
  initialLoganJobId,
  initialMessage,
  initialSessionId,
  sessionKey,
}: UseAssistantChatOptions): UseAssistantChatReturn => {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([]);
  const [schema, setSchema] = useState<AnalysisSchema | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [logan, setLogan] = useState<LoganContext | null>(null);
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
  const initialMessageSentRef = useRef(false);
  const router = useRouter();
  // A question of whitespace is no question: it would neither be asked nor
  // leave the conversation it displaced restorable.
  const question = initialMessage?.trim();

  // Hydrate from either an explicit initialSessionId (URL param, set by the
  // saved-analysis restore flow) or a localStorage-stored session. URL wins.
  // Either way we call the restore endpoint so we get computed handoff state
  // (handoff_url, is_complete, suggestions), not just messages + schema.
  useEffect(() => {
    // Until the query settles a handed-over question is invisible, and
    // restoring on that first pass would race the question to the message list.
    if (!router.isReady) return;
    // A Logan job opens its own session below and outranks both sources.
    if (initialLoganJobId) return;
    // A question handed over from elsewhere on the site opens a conversation of
    // its own; restoring here would graft it onto whatever came before.
    if (question) return;

    // Once that question has been asked, the stored pointer is the conversation
    // it just opened -- restoring it would only re-fetch what is already on
    // screen. A session the URL names is a different matter: it is somewhere the
    // user has navigated to, and it still restores.
    const storedId = initialMessageSentRef.current
      ? null
      : localStorage.getItem(sessionKey);
    const sourceId = initialSessionId ?? storedId;
    if (!sourceId) return;

    let cancelled = false;
    // Adopt before the round trip: an unset ref sends session_id: undefined, so
    // a failed restore would open a new session and overwrite the kept pointer.
    sessionIdRef.current = sourceId;
    setIsRestoring(true);

    assistantAPIClient
      .assistantRestore(sourceId)
      .then((restored) => {
        if (cancelled) return;
        sessionIdRef.current = restored.session_id;
        localStorage.setItem(sessionKey, restored.session_id);
        setMessages(restored.messages);
        setSchema(restored.schema_state);
        setSuggestions(restored.suggestions);
        setIsComplete(restored.is_complete);
        setHandoffUrl(restored.handoff_url);
        setLogan(restored.logan ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = httpStatus(error);
        // No response, a server error, or a throttle: the session is probably
        // still there, so keep the pointer and let a reload pick it up. Dropping
        // it here would turn a blip into permanent loss.
        if (
          status === undefined ||
          status >= 500 ||
          status === 408 ||
          status === 429
        ) {
          setError("Failed to restore the previous conversation.");
          return;
        }
        // Any other 4xx and this browser is never getting that session back --
        // 404 it's gone, 403 the signing cookie no longer matches it. Drop the
        // id so the next message opens a fresh session instead of re-failing.
        sessionIdRef.current = null;
        // Only clear the pointer if it's still the one that failed -- a newer
        // session may have replaced it while this request was in flight.
        if (localStorage.getItem(sessionKey) === sourceId) {
          localStorage.removeItem(sessionKey);
        }
        // Only worth mentioning if the id came from the URL; a stale
        // localStorage pointer going bad is routine.
        if (initialSessionId) {
          setError("That conversation is no longer available.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return (): void => {
      cancelled = true;
    };
  }, [
    initialLoganJobId,
    initialSessionId,
    question,
    router.isReady,
    sessionKey,
  ]);

  // Opening from a Logan search wins over a URL session id and localStorage:
  // the person just clicked "ask the assistant about this cohort", so a new
  // conversation bound to that job is what they meant. The prior session is
  // not deleted -- it lives out its TTL and a saved analysis is unaffected.
  useEffect(() => {
    if (!initialLoganJobId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    setIsRestoring(true);
    setError(null);

    assistantAPIClient
      .assistantCreateSession({ logan_job_id: initialLoganJobId })
      .then((created) => {
        if (cancelled) return;
        sessionIdRef.current = created.session_id;
        localStorage.setItem(sessionKey, created.session_id);
        setMessages(created.messages);
        setSchema(created.schema_state);
        setSuggestions(created.suggestions);
        setIsComplete(created.is_complete);
        setHandoffUrl(created.handoff_url);
        setLogan(created.logan ?? null);
        stripQueryParam(router, [ASSISTANT_QUERY_PARAM.LOGAN_JOB]);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        sessionIdRef.current = null;
        setError(loganSessionErrorMessage(error, initialLoganJobId));
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return (): void => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable for the life of the page; listing it would re-run this effect on every shallow replace, including the one it performs itself
  }, [initialLoganJobId, sessionKey]);

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
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
        localStorage.setItem(sessionKey, response.session_id);

        // Add assistant reply
        setMessages((prev) => [
          ...prev,
          { content: response.reply, role: "assistant" },
        ]);

        setSchema(response.schema_state);
        setSuggestions(response.suggestions);
        setIsComplete(response.is_complete);
        setHandoffUrl(response.handoff_url);
        setLogan(response.logan ?? null);
      } catch (err) {
        const errorMessage = handleChatError(err);
        setError(errorMessage);
        setLastFailedMessage(message);
      } finally {
        setLoading(false);
        sendingRef.current = false;
      }
    },
    [sessionKey]
  );

  // Ask the handed-over question once, then drop it from the URL: it outlives
  // the send otherwise, and a reload would open a second conversation asking
  // the same thing.
  useEffect(() => {
    if (!router.isReady) return;

    if (!question || initialMessageSentRef.current) return;
    initialMessageSentRef.current = true;

    // The conversation this question opens is its own: a session named in the
    // URL alongside the question is left behind rather than continued, matching
    // the restore this effect's counterpart skips. The stored pointer goes with
    // the ref: a send that fails leaves it as the only trace of the displaced
    // conversation, and the question -- stripped from the URL below -- would not
    // be there to displace it again on a reload.
    sessionIdRef.current = null;
    localStorage.removeItem(sessionKey);
    void sendMessage(question);
    // Both parameters go: ?sessionId= outranks the stored pointer on mount, so
    // leaving it behind means a reload restores the very conversation the
    // question displaced and orphans the one it opened.
    stripQueryParam(router, [
      ASSISTANT_QUERY_PARAM.QUESTION,
      ASSISTANT_QUERY_PARAM.SESSION_ID,
    ]);
  }, [question, router, sendMessage, sessionKey]);

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
    localStorage.removeItem(sessionKey);
    // Drop ?sessionId= as well. It outranks localStorage on mount, so leaving it
    // means a reload restores the conversation we just walked away from and
    // orphans whatever replaced it.
    if (router.query[ASSISTANT_QUERY_PARAM.SESSION_ID]) {
      stripQueryParam(router, [ASSISTANT_QUERY_PARAM.SESSION_ID]);
    }
    setMessages([]);
    setSchema(null);
    setSuggestions([]);
    setIsComplete(false);
    setHandoffUrl(null);
    setLogan(null);
    setError(null);
    setLastFailedMessage(null);
    setSaveMessage(null);
  }, [router, sessionKey]);

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
    logan,
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
 * Drops query parameters from the current URL, leaving the rest of the route
 * untouched.
 * @param router - Next router.
 * @param names - Query parameters to drop.
 */
function stripQueryParam(router: NextRouter, names: string[]): void {
  const query = { ...router.query };
  for (const name of names) delete query[name];
  router
    .replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    .catch(() => {
      // Cosmetic: whatever the parameter carried has already been consumed.
    });
}

/**
 * Copy for a failed Logan session open. The error is a string today, so the
 * results path is spelled out rather than linked.
 * @param error - The thrown value.
 * @param jobId - The Logan job that failed to open.
 * @returns A user-facing error string.
 */
function loganSessionErrorMessage(error: unknown, jobId: string): string {
  const status = httpStatus(error);
  const resultsPath = `/logan-search?job=${jobId}`;
  if (status === 404) {
    return `That search's results have expired. Re-run it at ${resultsPath} to bring them back.`;
  }
  if (status === 409) {
    return `That search is still running. Wait for it at ${resultsPath}, then try again.`;
  }
  if (status === 422) {
    return `That search failed in Galaxy. Check it at ${resultsPath}.`;
  }
  return handleChatError(error);
}

/**
 * Pull the HTTP status off a thrown request error, if it carries one.
 *
 * Duck-typed rather than `instanceof HTTPError` -- a duplicated ky copy would
 * silently mis-classify a restore. No status reads as the transient case.
 * @param error - The thrown value from a failed request
 * @returns The HTTP status, or undefined if the error doesn't carry one
 */
function httpStatus(error: unknown): number | undefined {
  const response = (error as { response?: { status?: unknown } } | null)
    ?.response;
  return typeof response?.status === "number" ? response.status : undefined;
}

/**
 * Map API errors to user-friendly messages.
 * @param error - The caught error
 * @returns A user-facing error string
 */
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
