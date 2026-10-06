import { useAuth } from "@repo/shared/providers/authentication/provider";
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
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ChatMessageDisplay,
  LastSave,
  UseAssistantChatOptions,
  UseAssistantChatReturn,
} from "./types";

// A save that failed for one of these will fail the same way next time: the
// deployment cannot save at all, there is nothing to save, the session is not
// ours, or it is gone. Anything else -- a network drop, a 500 -- is worth
// another attempt when the effect next runs.
const PERMANENT_SAVE_FAILURES = new Set([403, 404, 409, 501]);

// Backoff for a save that failed in a way a retry could fix. Bounded per
// session: past the last one the latch holds, so a failure that only looks
// transient (an unprovisioned user answers 503 every time) costs a handful of
// requests rather than one per turn for the life of the conversation.
const SAVE_RETRY_DELAYS_MS = [5_000, 30_000, 120_000];

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
 * @returns Chat state, the session on screen and last save, sendMessage, and reset/retry functions.
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
  const [isSaved, setIsSaved] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [logan, setLogan] = useState<LoganContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  // A restore that failed for a reason a retry could fix, and the count of
  // retries asked for: bumping it re-runs the restore, which a URL already
  // naming the session would not do on its own.
  const [isRestoreFailed, setIsRestoreFailed] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  // Whether the server has confirmed the conversation on screen is saved.
  // Unlike isSaved -- "saved to your account", which signing out clears -- it
  // outlives the account state, so New analysis never discards a saved one.
  const isPersistedRef = useRef(false);
  const sendingRef = useRef(false);
  // Bumped each time a different conversation takes the screen. A request
  // started under an older value answers for a conversation no longer shown,
  // and its result is dropped rather than landing in the one that replaced it.
  const conversationRef = useRef(0);
  // The session whose conversation is on screen, once a restore or turn has
  // put it there -- not merely the one requested, which a failed restore
  // leaves behind. Restoring it again would wipe the screen and drop a reply
  // still in flight for it. Mirrored to state for rendering, since a ref
  // change re-renders nothing.
  const shownSessionRef = useRef<string | null>(null);
  const [shownSessionId, setShownSessionId] = useState<string | null>(null);
  // Makes a session the conversation on screen, and the one a reload restores.
  const showSession = useCallback(
    (id: string): void => {
      sessionIdRef.current = id;
      shownSessionRef.current = id;
      setShownSessionId(id);
      localStorage.setItem(sessionKey, id);
    },
    [sessionKey]
  );
  // Set each time the server confirms a conversation was written -- naming
  // which, since a reply can land for one no longer on screen -- so a
  // saved-conversation list can refresh without guessing.
  const [lastSave, setLastSave] = useState<LastSave | null>(null);
  const initialMessageSentRef = useRef(false);
  // Set once this mount has opened a Logan-bound session. Dropping the
  // ?loganJob= param re-renders the page without it, which would otherwise
  // re-arm the restore effect against the id we just wrote.
  const loganOpenedRef = useRef(false);
  const saveAttemptRef = useRef<string | null>(null);
  const saveRetriesRef = useRef<{ count: number; sessionId: string | null }>({
    count: 0,
    sessionId: null,
  });
  const saveRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped by the retry timer: clearing the latch alone re-runs nothing, so
  // without it a failed save waited for the user's next turn -- which the
  // person who signed in only to keep this conversation may never send.
  const [saveRetryTick, setSaveRetryTick] = useState(0);
  const retrySave = useCallback((): void => {
    saveRetryTimerRef.current = null;
    setSaveRetryTick((tick) => tick + 1);
  }, []);
  const router = useRouter();
  const { isAuthenticated, isConfigured, isLoading: isAuthLoading } = useAuth();
  // A question of whitespace is no question: it would neither be asked nor
  // leave the conversation it displaced restorable.
  const question = initialMessage?.trim();

  // Clears what the conversation on screen left behind, including a turn still
  // in flight for it, and returns the generation the next one runs under.
  const startConversation = useCallback((): number => {
    conversationRef.current += 1;
    shownSessionRef.current = null;
    setShownSessionId(null);
    sendingRef.current = false;
    setMessages([]);
    setSchema(null);
    setSuggestions([]);
    setIsComplete(false);
    setIsSaved(false);
    setHandoffUrl(null);
    setLogan(null);
    setLoading(false);
    setIsRestoring(false);
    setError(null);
    setLastFailedMessage(null);
    setIsRestoreFailed(false);
    isPersistedRef.current = false;
    return conversationRef.current;
  }, []);

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
    // Once it has, the stored pointer is that session -- but a session the URL
    // names afterwards is one the user has since navigated to, and restores.
    if (loganOpenedRef.current && !initialSessionId) return;
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
    // Already on screen -- e.g. back to the bare page, whose stored pointer is
    // the conversation showing.
    if (sourceId === shownSessionRef.current) return;

    let cancelled = false;
    // Opening a conversation from the history list restores it on this page,
    // over whatever was on screen -- which must not outlive a failed restore,
    // nor be answered by a turn still in flight for it.
    const conversation = startConversation();
    // A reset or another restore since this one started has moved on from it.
    const isCurrent = (): boolean => conversationRef.current === conversation;
    const isStale = (): boolean => cancelled || !isCurrent();
    // Adopt before the round trip: an unset ref sends session_id: undefined, so
    // a failed restore would open a new session and overwrite the kept pointer.
    sessionIdRef.current = sourceId;
    setIsRestoring(true);

    assistantAPIClient
      .assistantRestore(sourceId)
      .then((restored) => {
        if (isStale()) return;
        showSession(restored.session_id);
        setMessages(restored.messages);
        setSchema(restored.schema_state);
        setSuggestions(restored.suggestions);
        setIsComplete(restored.is_complete);
        setHandoffUrl(restored.handoff_url);
        setLogan(restored.logan ?? null);
        // Whether this is already on disk is the server's to answer. Inferring
        // it from auth state instead would re-save every signed-in session on
        // every mount just to find out.
        setIsSaved(restored.saved);
        isPersistedRef.current = restored.saved;
      })
      .catch((error: unknown) => {
        if (isStale()) return;
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
          setError("Couldn't load that conversation.");
          setIsRestoreFailed(true);
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
        // Settled by the conversation, not the effect run: one cancelled by a
        // URL change that starts nothing new (a reset dropping ?sessionId=) is
        // still the restore on screen, and left set it would hold the input.
        if (isCurrent()) setIsRestoring(false);
      });

    return (): void => {
      cancelled = true;
    };
  }, [
    initialLoganJobId,
    initialSessionId,
    question,
    restoreAttempt,
    router.isReady,
    sessionKey,
    showSession,
    startConversation,
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
        loganOpenedRef.current = true;
        localStorage.setItem(sessionKey, created.session_id);
        setMessages(created.messages);
        setSchema(created.schema_state);
        setSuggestions(created.suggestions);
        setIsComplete(created.is_complete);
        setHandoffUrl(created.handoff_url);
        setLogan(created.logan ?? null);
        // ?sessionId= goes too: it names the conversation this one displaced,
        // and left behind it would be restored over the Logan session.
        stripQueryParam(router, [
          ASSISTANT_QUERY_PARAM.LOGAN_JOB,
          ASSISTANT_QUERY_PARAM.SESSION_ID,
        ]);
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
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || messages.length === 0) return;
    // Once per session. Without this, a deployment that cannot save at all
    // (no database configured) would fire a doomed request every turn.
    if (saveAttemptRef.current === currentSessionId) return;
    saveAttemptRef.current = currentSessionId;

    let cancelled = false;
    assistantAPIClient
      .assistantSaveSession(currentSessionId)
      .then(() => {
        // On disk whether or not this run is still current.
        setLastSave({ sessionId: currentSessionId });
        // Saved whatever cut this run short -- often just the same
        // conversation starting a turn -- so long as it is still the one open.
        if (sessionIdRef.current === currentSessionId) {
          isPersistedRef.current = true;
        }
        // The account label is another matter: a run cut short by signing out
        // must not claim the conversation for the account.
        if (!cancelled) setIsSaved(true);
      })
      .catch((error: unknown) => {
        // The label stays off, which is the honest reading. But the latch was
        // set before the request went out, so leaving it set after a failure
        // that a retry could fix means this session is never saved again --
        // and this effect exists for the user who signs in to keep what is on
        // screen and then sends nothing more.
        if (!isRetryableSaveFailure(error)) return;
        const retries = saveRetriesRef.current;
        if (retries.sessionId !== currentSessionId) {
          retries.sessionId = currentSessionId;
          retries.count = 0;
        }
        if (retries.count >= SAVE_RETRY_DELAYS_MS.length) return;
        const delay = SAVE_RETRY_DELAYS_MS[retries.count];
        retries.count += 1;
        saveAttemptRef.current = null;
        clearSaveRetry(saveRetryTimerRef);
        saveRetryTimerRef.current = setTimeout(retrySave, delay);
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
    retrySave,
    saveRetryTick,
  ]);

  useEffect(() => (): void => clearSaveRetry(saveRetryTimerRef), []);

  // Signing out doesn't unsave anything server-side, but it ends this
  // browser's claim to the conversation: AuthProvider.logout only clears the
  // user, with no reload, so the panel was left rendering "Saved to your
  // account" and "Sign in to keep this conversation" side by side. The latch
  // goes too, or signing back in would find the session already attempted and
  // never re-save it.
  useEffect(() => {
    if (isAuthLoading || !isConfigured || isAuthenticated) return;
    saveAttemptRef.current = null;
    saveRetriesRef.current = { count: 0, sessionId: null };
    clearSaveRetry(saveRetryTimerRef);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    setIsSaved(false);
  }, [isAuthLoading, isAuthenticated, isConfigured]);

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!message.trim() || sendingRef.current) return;
      sendingRef.current = true;
      const conversation = conversationRef.current;
      const isCurrent = (): boolean => conversationRef.current === conversation;

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
        // On disk even if the conversation has since been replaced on screen.
        if (response.saved) setLastSave({ sessionId: response.session_id });
        // The reply belongs to a conversation since replaced on screen, and
        // adopting its session would send later turns there.
        if (!isCurrent()) return;

        showSession(response.session_id);

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
        // Latched, not mirrored: a later turn whose write fails does not
        // un-save the turns already on disk, and flickering the label would
        // say something worse than either state on its own.
        if (response.saved) {
          setIsSaved(true);
          isPersistedRef.current = true;
        }
      } catch (err) {
        if (!isCurrent()) return;
        const errorMessage = handleChatError(err);
        setError(errorMessage);
        setLastFailedMessage(message);
      } finally {
        // Whatever replaced the conversation already let go of the send.
        if (isCurrent()) {
          setLoading(false);
          sendingRef.current = false;
        }
      }
    },
    [showSession]
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

  const retryRestore = useCallback((): Promise<void> => {
    setRestoreAttempt((attempt) => attempt + 1);
    return Promise.resolve();
  }, []);

  const resetSession = useCallback((): void => {
    const oldId = sessionIdRef.current;
    // Only a conversation that isn't saved is being discarded. A saved one
    // stays in the user's history, and reopening it rebuilds a live session if
    // the old one is gone -- so deleting it frees nothing worth having, and
    // races a reopen that lands before the delete does.
    if (oldId && !isPersistedRef.current) {
      assistantAPIClient.assistantDeleteSession(oldId).catch(() => {});
    }
    // Also drops a restore or turn still in flight, whose result would
    // otherwise bring back the conversation just walked away from.
    startConversation();
    sessionIdRef.current = null;
    loganOpenedRef.current = false;
    localStorage.removeItem(sessionKey);
    // Drop ?sessionId= as well. It outranks localStorage on mount, so leaving it
    // means a reload restores the conversation we just walked away from and
    // orphans whatever replaced it.
    if (router.query[ASSISTANT_QUERY_PARAM.SESSION_ID]) {
      stripQueryParam(router, [ASSISTANT_QUERY_PARAM.SESSION_ID]);
    }
  }, [router, sessionKey, startConversation]);

  // A failed message retries that message; a failed restore, the restore.
  let onRetry: (() => Promise<void>) | undefined;
  if (lastFailedMessage) onRetry = retry;
  else if (isRestoreFailed) onRetry = retryRestore;

  return {
    error,
    handoffUrl,
    isComplete,
    isRestoring,
    isSaved,
    lastSave,
    loading,
    logan,
    messages,
    onRetry,
    resetSession,
    retryRestore,
    schema,
    sendMessage,
    shownSessionId,
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
 * Cancel a pending save retry, if one is scheduled.
 * @param timerRef - Ref holding the retry timer.
 */
function clearSaveRetry(
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
): void {
  if (timerRef.current === null) return;
  clearTimeout(timerRef.current);
  timerRef.current = null;
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
