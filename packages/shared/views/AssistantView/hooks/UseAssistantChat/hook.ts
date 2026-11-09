import { useAuth } from "@repo/shared/providers/authentication/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type {
  AnalysisSchema,
  AssistantChatResponse,
  ClearableField,
  LoganContext,
  SuggestionChip,
} from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
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
  RestoreOptions,
  TurnRequest,
  UseAssistantChatOptions,
  UseAssistantChatReturn,
} from "./types";
import { keepSavedAnalysisId, replaceQuery, stripQueryParam } from "./utils";

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
 * clicked through from a cohort. All of that happens once, on mount; a saved
 * conversation opened afterwards comes through `onOpenConversation`.
 * @param root0 - Hook options.
 * @param root0.initialLoganJobId - Logan job to open a new session from.
 * @param root0.initialMessage - Question to open a new conversation with.
 * @param root0.initialSessionId - Existing assistant session to continue.
 * @param root0.sessionKey - localStorage key under which the session id is stored.
 * @returns Chat actions (send, clear a field, open a saved conversation, reset, retry) and chat state, including the session and saved analysis on screen and the last save.
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
  const [isSaved, setIsSaved] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [logan, setLogan] = useState<LoganContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] =
    useState<TurnRequest | null>(null);
  // A restore that failed for a reason a retry could fix, and whether it was
  // for a conversation someone asked for -- which the retry reports alike.
  const [isRestoreFailed, setIsRestoreFailed] = useState(false);
  const restoreIsNamedRef = useRef(false);
  // A saved conversation being opened, from asking the server for it until its
  // restore takes over -- shown as restoring throughout. Until then nothing may
  // send or start over it: the open would wipe whatever they put on screen.
  const openingRef = useRef(false);
  // Set once the mount's restore has had its say, so a URL change afterwards --
  // a parameter dropped, or one written by an open -- restores nothing.
  const hasHydratedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  const sendingRef = useRef(false);
  // Bumped each time a different conversation takes the screen. A request
  // started under an older value answers for a conversation no longer shown,
  // and its result is dropped rather than landing in the one that replaced it.
  const conversationRef = useRef(0);
  // Cleared when the page unmounts. A request still in flight then answers for
  // a page no longer there, and must not write the stored pointer or the URL.
  // Strict mode's effect replay sets it again before anything can settle, so
  // work in flight across the replay still lands.
  const isMountedRef = useRef(true);
  // The session whose conversation is on screen, once a restore or turn has
  // put it there -- not merely the one requested, which a failed restore
  // leaves behind. Opening it again would wipe the screen and drop a reply
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
  // The saved analysis the conversation on screen belongs to, once one exists.
  // Unlike the session id it never changes, so it is what tells a list of
  // saved conversations which one is open.
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  // Set each time the server confirms a conversation was written -- naming
  // which, since a reply can land for one no longer on screen -- so a
  // saved-conversation list can refresh without guessing.
  const [lastSave, setLastSave] = useState<LastSave | null>(null);
  const initialMessageSentRef = useRef(false);
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
    setSavedAnalysisId(null);
    sendingRef.current = false;
    setMessages([]);
    setSchema(null);
    setSuggestions([]);
    setIsSaved(false);
    setHandoffUrl(null);
    setLogan(null);
    setLoading(false);
    setIsRestoring(false);
    setError(null);
    setLastFailedRequest(null);
    setIsRestoreFailed(false);
    return conversationRef.current;
  }, []);

  // Restores a session as the conversation on screen, in place of whatever was
  // there -- which must not outlive a failed restore, nor be answered by a turn
  // still in flight for it. Goes through the restore endpoint, so the computed
  // handoff state (handoff_url, suggestions) comes back too, not just messages
  // and schema.
  const restoreSession = useCallback(
    (sourceId: string, { isNamed }: RestoreOptions): void => {
      const conversation = startConversation();
      // A reset or another restore since this one started has moved on from it.
      const isCurrent = (): boolean =>
        isMountedRef.current && conversationRef.current === conversation;
      // Adopt before the round trip: an unset ref sends session_id: undefined,
      // so a failed restore would open a new session and overwrite the kept
      // pointer.
      sessionIdRef.current = sourceId;
      restoreIsNamedRef.current = isNamed;
      setIsRestoring(true);

      assistantAPIClient
        .assistantRestore(sourceId)
        .then((restored) => {
          if (!isCurrent()) return;
          showSession(restored.session_id);
          setSavedAnalysisId(restored.saved_analysis_id);
          setMessages(restored.messages);
          setSchema(restored.schema_state);
          setSuggestions(restored.suggestions);
          setHandoffUrl(restored.handoff_url);
          setLogan(restored.logan ?? null);
          // Whether this is already on disk is the server's to answer.
          // Inferring it from auth state instead would re-save every signed-in
          // session on every mount just to find out.
          setIsSaved(restored.saved);
        })
        .catch((error: unknown) => {
          if (!isCurrent()) return;
          const status = httpStatus(error);
          // No response, a server error, or a throttle: the session is probably
          // still there, so keep the pointer and let a reload pick it up.
          // Dropping it here would turn a blip into permanent loss.
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
          // Any other 4xx and this browser is never getting that session back
          // -- 404 it's gone, 403 the signing cookie no longer matches it. Drop
          // the id so the next message opens a fresh session instead of
          // re-failing.
          sessionIdRef.current = null;
          // Only clear the pointer if it's still the one that failed -- a newer
          // session may have replaced it while this request was in flight.
          if (localStorage.getItem(sessionKey) === sourceId) {
            localStorage.removeItem(sessionKey);
          }
          // Only worth mentioning for a conversation someone asked for; a stale
          // localStorage pointer going bad is routine.
          if (isNamed) {
            setError("That conversation is no longer available.");
          }
        })
        .finally(() => {
          if (isCurrent()) setIsRestoring(false);
        });
    },
    [sessionKey, showSession, startConversation]
  );

  // Hydrate, once, from either an explicit initialSessionId (URL param, set by
  // the saved-analysis open) or a localStorage-stored session. URL wins.
  useEffect(() => {
    // Until the query settles a handed-over question is invisible, and
    // restoring on that first pass would race the question to the message list.
    if (!router.isReady || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    // A Logan job opens its own session below and outranks both sources.
    if (initialLoganJobId) return;
    // A question handed over from elsewhere on the site opens a conversation of
    // its own; restoring here would graft it onto whatever came before.
    if (question) return;

    const sourceId = initialSessionId ?? localStorage.getItem(sessionKey);
    if (!sourceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    restoreSession(sourceId, { isNamed: Boolean(initialSessionId) });
  }, [
    initialLoganJobId,
    initialSessionId,
    question,
    restoreSession,
    router.isReady,
    sessionKey,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return (): void => {
      isMountedRef.current = false;
    };
  }, []);

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
        setSavedAnalysisId(created.saved_analysis_id);
        setMessages(created.messages);
        setSchema(created.schema_state);
        setSuggestions(created.suggestions);
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
      .then(({ saved_analysis_id }) => {
        // On disk whether or not this run is still current.
        setLastSave({ savedAnalysisId: saved_analysis_id });
        // Checked against the session, not this run: a turn starting cancels
        // the run, but the session is still the one just written, and a turn
        // that fails would never say so. A conversation that replaced it has
        // moved the session on.
        if (sessionIdRef.current === currentSessionId) {
          setSavedAnalysisId(saved_analysis_id);
        }
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

  // One path for every turn. A setup-panel clear rides it too, as structured
  // clear_fields the server applies before the model runs, so the clear can't
  // hinge on how the model reads a message and the assistant still answers it.
  const runTurn = useCallback(
    async ({ clearFields, message }: TurnRequest): Promise<void> => {
      if (
        (!message?.trim() && !clearFields?.length) ||
        sendingRef.current ||
        openingRef.current
      )
        return;
      sendingRef.current = true;
      const conversation = conversationRef.current;
      const isCurrent = (): boolean =>
        isMountedRef.current && conversationRef.current === conversation;

      setLoading(true);
      setError(null);
      setLastFailedRequest(null);

      // Add user message immediately for responsiveness
      if (message) {
        setMessages((prev) => [...prev, { content: message, role: "user" }]);
      }

      try {
        const response: AssistantChatResponse =
          await assistantAPIClient.assistantChat({
            clear_fields: clearFields,
            message,
            session_id: sessionIdRef.current ?? undefined,
          });
        // On disk even if the conversation has since been replaced on screen.
        if (response.saved && response.saved_analysis_id) {
          setLastSave({ savedAnalysisId: response.saved_analysis_id });
        }
        // The reply belongs to a conversation since replaced on screen, and
        // adopting its session would send later turns there.
        if (!isCurrent()) return;

        // A turn that raced a save and failed its own reports no analysis,
        // which for the same session is no news. See keepSavedAnalysisId.
        const isSameSession = sessionIdRef.current === response.session_id;
        showSession(response.session_id);
        setSavedAnalysisId((current) =>
          keepSavedAnalysisId(
            current,
            response.saved_analysis_id,
            isSameSession
          )
        );

        // The turn's note (e.g. "Organism cleared.") sits before the user's
        // line, as it does in the stored transcript, then the reply.
        const { note } = response;
        setMessages((prev) => {
          // A clear of a field already empty changed nothing and gets no reply.
          if (!note && !response.reply) return prev;
          const reply = { content: response.reply, role: "assistant" } as const;
          if (!note) return [...prev, reply];
          const noteLine = { content: note, role: "system" } as const;
          return message
            ? [...prev.slice(0, -1), noteLine, ...prev.slice(-1), reply]
            : [...prev, noteLine, reply];
        });

        setSchema(response.schema_state);
        setSuggestions(response.suggestions);
        setHandoffUrl(response.handoff_url);
        setLogan(response.logan ?? null);
        // Latched, not mirrored: a later turn whose write fails does not
        // un-save the turns already on disk, and flickering the label would
        // say something worse than either state on its own.
        if (response.saved) setIsSaved(true);
      } catch (err) {
        if (!isCurrent()) return;
        const errorMessage = handleChatError(err);
        setError(errorMessage);
        setLastFailedRequest({ clearFields, message });
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

  const onSendMessage = useCallback(
    (message: string): Promise<void> => runTurn({ message }),
    [runTurn]
  );

  const onClearField = useCallback(
    async (field: ClearableField): Promise<void> => {
      // Nothing to clear before there is a conversation to clear it on.
      if (!sessionIdRef.current) return;
      await runTurn({ clearFields: [field] });
    },
    [runTurn]
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
    void onSendMessage(question);
    // Both parameters go: ?sessionId= outranks the stored pointer on mount, so
    // leaving it behind means a reload restores the very conversation the
    // question displaced and orphans the one it opened.
    stripQueryParam(router, [
      ASSISTANT_QUERY_PARAM.QUESTION,
      ASSISTANT_QUERY_PARAM.SESSION_ID,
    ]);
  }, [onSendMessage, question, router, sessionKey]);

  const onRetryTurn = useCallback(async (): Promise<void> => {
    // An open in flight is replacing the conversation the failure belongs to.
    if (!lastFailedRequest || openingRef.current) return;
    const request = lastFailedRequest;
    setLastFailedRequest(null);
    setError(null);
    // Only a message left a line behind; a clear on its own added nothing.
    if (request.message) setMessages((prev) => prev.slice(0, -1));
    await runTurn(request);
  }, [lastFailedRequest, runTurn]);

  // Reached through onRetry, which offers it once a restore has failed.
  const onRetryRestore = useCallback((): Promise<void> => {
    // A transient failure keeps the session it was restoring; anything else
    // dropped it, and there is nothing left to retry. An open in flight would
    // be discarded by a restore started over it.
    if (sessionIdRef.current && !openingRef.current) {
      restoreSession(sessionIdRef.current, {
        isNamed: restoreIsNamedRef.current,
      });
    }
    return Promise.resolve();
  }, [restoreSession]);

  const onOpenConversation = useCallback(
    async (id: string): Promise<boolean> => {
      // The session cookie vouches for one conversation at a time, so a second
      // open, or one mid-reply, would race for it and lock out the loser.
      if (openingRef.current || sendingRef.current) return false;
      openingRef.current = true;
      const conversation = conversationRef.current;
      setIsRestoring(true);
      let isHandedOver = false;
      try {
        // A failure leaves the conversation on screen as it was, and is the
        // caller's to report.
        const { session_id } = await apiClient.openSavedAnalysis(id);
        // Left the page, or moved on, since: the open answers for nothing on
        // screen.
        if (!isMountedRef.current || conversationRef.current !== conversation) {
          return false;
        }
        // Already showing: restoring it again would wipe the screen for nothing.
        if (session_id === shownSessionRef.current) return false;
        restoreSession(session_id, { isNamed: true });
        isHandedOver = true;
        // An output of the open, not its trigger: the URL is what a reload
        // restores, so it names the conversation opened and nothing else. A
        // replace, not a push: the session cookie vouches for one conversation
        // at a time, so an entry for the one left behind could not be restored
        // by Back.
        replaceQuery(router, {
          [ASSISTANT_QUERY_PARAM.SESSION_ID]: session_id,
        });
        return true;
      } finally {
        openingRef.current = false;
        // A restore that took over settles the flag; anything else hands the
        // screen back as it was.
        if (!isHandedOver && conversationRef.current === conversation) {
          setIsRestoring(false);
        }
      }
    },
    [restoreSession, router]
  );

  const onResetSession = useCallback((): boolean => {
    // Opening a conversation is starting one: a reset would only race it.
    if (openingRef.current) return false;
    // The conversation left behind isn't deleted: it may be saved, which the
    // page can't always tell, and reopening a saved one would race the delete.
    // Unsaved, its live session simply expires.
    //
    // Starting afresh also drops a restore or turn still in flight, whose
    // result would otherwise bring back the conversation just walked away from.
    startConversation();
    sessionIdRef.current = null;
    localStorage.removeItem(sessionKey);
    // Drop ?sessionId= as well. It outranks localStorage on mount, so leaving it
    // means a reload restores the conversation we just walked away from and
    // orphans whatever replaced it.
    if (router.query[ASSISTANT_QUERY_PARAM.SESSION_ID]) {
      stripQueryParam(router, [ASSISTANT_QUERY_PARAM.SESSION_ID]);
    }
    return true;
  }, [router, sessionKey, startConversation]);

  // A failed message retries that message; a failed restore, the restore.
  let onRetry: (() => Promise<void>) | undefined;
  if (lastFailedRequest) onRetry = onRetryTurn;
  else if (isRestoreFailed) onRetry = onRetryRestore;

  return {
    actions: {
      onClearField,
      onOpenConversation,
      onResetSession,
      onRetry,
      onSendMessage,
    },
    state: {
      error,
      handoffUrl,
      isRestoring,
      isSaved,
      lastSave,
      loading,
      logan,
      messages,
      savedAnalysisId,
      schema,
      shownSessionId,
      suggestions,
    },
  };
};

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
