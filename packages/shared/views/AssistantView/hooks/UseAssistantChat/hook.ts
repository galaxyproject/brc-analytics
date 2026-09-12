import { useAuth } from "@repo/shared/providers/authentication/provider";
import type {
  AnalysisSchema,
  AssistantChatResponse,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

// A save that failed for one of these will fail the same way next time: the
// deployment cannot save at all, there is nothing to save, the session is not
// ours, or it is gone. Anything else -- a network drop, a 500 -- is worth
// another attempt when the effect next runs.
const PERMANENT_SAVE_FAILURES = new Set([403, 404, 409, 501]);

/**
 * Whether a failed save is worth attempting again.
 * @param error - Rejection from the save request.
 * @returns true when a later attempt could succeed.
 */
function isRetryableSaveFailure(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === undefined || !PERMANENT_SAVE_FAILURES.has(status);
}

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface UseAssistantChatReturn {
  error: string | null;
  handoffUrl: string | null;
  isComplete: boolean;
  isRestoring: boolean;
  isSaved: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  resetSession: () => void;
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  suggestions: SuggestionChip[];
}

interface UseAssistantChatOptions {
  initialMessage?: string;
  initialSessionId?: string;
  sessionKey: string;
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * Persists session_id to localStorage and restores on mount; explicit
 * `initialSessionId` from URL params takes precedence over the stored value.
 * An `initialMessage` opens a new conversation with that question instead.
 * @param root0 - Hook options.
 * @param root0.initialMessage - Question to open a new conversation with.
 * @param root0.initialSessionId - Existing assistant session to continue.
 * @param root0.sessionKey - localStorage key under which the session id is stored.
 * @returns Chat state, sendMessage, and reset/retry functions.
 */
export const useAssistantChat = ({
  initialMessage,
  initialSessionId,
  sessionKey,
}: UseAssistantChatOptions): UseAssistantChatReturn => {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([]);
  const [schema, setSchema] = useState<AnalysisSchema | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  const sendingRef = useRef(false);
  const initialMessageSentRef = useRef(false);
  const saveAttemptRef = useRef<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, isConfigured, isLoading: isAuthLoading } = useAuth();
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
        // Whether this is already on disk is the server's to answer. Inferring
        // it from auth state instead would re-save every signed-in session on
        // every mount just to find out.
        setIsSaved(restored.saved);
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
  }, [initialSessionId, question, router.isReady, sessionKey]);

  // Auto-save rides on chat turns, which leaves the sign-in case uncovered:
  // someone who signed in *because* we offered to keep this conversation has
  // not sent a turn since, so nothing has been written and the session dies
  // with its two-hour TTL. Claim and persist it as soon as we know who they
  // are -- and only let the UI call it saved once that has come back.
  useEffect(() => {
    if (!isConfigured || isAuthLoading || !isAuthenticated) return;
    // A turn in flight is about to save this itself, and mid-send the
    // messages already include the user's line with no reply yet.
    if (isSaved || isRestoring || loading) return;
    const sessionId = sessionIdRef.current;
    if (!sessionId || messages.length === 0) return;
    // Once per session. Without this, a deployment that cannot save at all
    // (no database configured) would fire a doomed request every turn.
    if (saveAttemptRef.current === sessionId) return;
    saveAttemptRef.current = sessionId;

    let cancelled = false;
    assistantAPIClient
      .assistantSaveSession(sessionId)
      .then(() => {
        if (!cancelled) setIsSaved(true);
      })
      .catch((error: unknown) => {
        // The label stays off, which is the honest reading. But the latch was
        // set before the request went out, so leaving it set after a failure
        // that a retry could fix means this session is never saved again --
        // and this effect exists for the user who signs in to keep what is on
        // screen and then sends nothing more.
        if (isRetryableSaveFailure(error)) saveAttemptRef.current = null;
      });

    return (): void => {
      cancelled = true;
    };
  }, [
    isAuthLoading,
    isAuthenticated,
    isConfigured,
    isRestoring,
    isSaved,
    loading,
    messages.length,
  ]);

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!message.trim() || sendingRef.current) return;
      sendingRef.current = true;

      setLoading(true);
      setError(null);
      setLastFailedMessage(null);

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
        // Latched, not mirrored: a later turn whose write fails does not
        // un-save the turns already on disk, and flickering the label would
        // say something worse than either state on its own.
        if (response.saved) setIsSaved(true);
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
    setIsSaved(false);
    setHandoffUrl(null);
    setError(null);
    setLastFailedMessage(null);
  }, [router, sessionKey]);

  return {
    error,
    handoffUrl,
    isComplete,
    isRestoring,
    isSaved,
    loading,
    messages,
    onRetry: lastFailedMessage ? retry : undefined,
    resetSession,
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
