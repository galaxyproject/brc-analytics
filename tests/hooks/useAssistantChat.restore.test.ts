import { apiClient } from "@repo/shared/services/api-client/api-client";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@repo/shared/services/assistant-api-client", () => ({
  assistantAPIClient: {
    assistantChat: jest.fn(),
    assistantDeleteSession: jest.fn().mockResolvedValue(undefined),
    assistantRestore: jest.fn(),
  },
}));
// Keeps ESM-only ky out of the jest module graph, which it enters through the
// shared client the hook imports for saved analyses.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: { openSavedAnalysis: jest.fn() },
}));

const mockReplace = jest.fn().mockResolvedValue(true);
let mockQuery: Record<string, string> = {};
let mockIsReady = true;
jest.mock("next/router", () => ({
  useRouter: (): {
    isReady: boolean;
    pathname: string;
    query: Record<string, string>;
    replace: jest.Mock;
  } => ({
    isReady: mockIsReady,
    pathname: "/assistant",
    query: mockQuery,
    replace: mockReplace,
  }),
}));
const mockClient = assistantAPIClient as jest.Mocked<typeof assistantAPIClient>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

type ChatResponse = Awaited<ReturnType<typeof mockClient.assistantChat>>;
type RestoreResponse = Awaited<ReturnType<typeof mockClient.assistantRestore>>;

const SESSION_KEY = "brc-assistant-session-id";
const STORED_ID = "stored1111222233334444555566667777";

/**
 * A chat response for one turn.
 * @param sessionId - Session the turn ran in
 * @param reply - The assistant's reply
 * @returns The payload assistantChat resolves with
 */
function chatResponse(sessionId: string, reply: string): ChatResponse {
  return {
    handoff_url: null,
    is_complete: false,
    reply,
    saved: false,
    saved_analysis_id: null,
    schema_state: null,
    session_id: sessionId,
    suggestions: [],
  } as unknown as ChatResponse;
}

/**
 * Shaped like the ky HTTPError the client throws -- the hook reads `.response.status`.
 * @param status - HTTP status to attach
 * @returns An error carrying that status
 */
function httpError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`${status}`), { response: { status } });
}

describe("useAssistantChat restore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Drops responses a test queued for an open it then refused.
    mockApiClient.openSavedAnalysis.mockReset();
    localStorage.clear();
    mockQuery = {};
    mockIsReady = true;
  });

  test("a 404 on a stored session clears the pointer without alarming the user", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(404));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  test("a 404 on a session named in the URL says so rather than rendering blank", async () => {
    mockClient.assistantRestore.mockRejectedValue(httpError(404));

    const { result } = renderHook(() =>
      useAssistantChat({ initialSessionId: STORED_ID, sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));
    expect(result.current.state.error).toMatch(/no longer available/i);
  });

  test("a 403 drops the pointer -- this browser can never restore that session", async () => {
    // The signing cookie no longer matches the id, which is permanent. Keeping
    // it would re-send the same id on every message and wedge the chat.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(403));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  test("a 429 keeps the pointer -- throttling is transient", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(429));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.state.error).not.toBeNull());
    expect(localStorage.getItem(SESSION_KEY)).toBe(STORED_ID);
  });

  test("a 5xx keeps the pointer -- the session is probably still alive", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(503));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.state.error).not.toBeNull());
    expect(localStorage.getItem(SESSION_KEY)).toBe(STORED_ID);
  });

  test("after a 5xx the next message continues the kept session, not a new one", async () => {
    // Preserving the pointer is pointless if the next send ignores it: an
    // unadopted id sends session_id undefined, the server opens a fresh session
    // and success overwrites the very pointer we kept.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(503));
    mockClient.assistantChat.mockResolvedValue(chatResponse(STORED_ID, "ok"));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.state.error).not.toBeNull());

    await act(async () => {
      await result.current.actions.onSendMessage("still there?");
    });

    expect(mockClient.assistantChat).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: STORED_ID })
    );
  });

  test("reset strips ?sessionId= so a reload can't resurrect the old session", async () => {
    // initialSessionId outranks localStorage on mount. Leaving the query param
    // behind means reloading restores the conversation the user just left and
    // orphans whatever they started instead.
    mockQuery = { sessionId: STORED_ID };
    mockClient.assistantRestore.mockRejectedValue(httpError(503));

    const { result } = renderHook(() =>
      useAssistantChat({ initialSessionId: STORED_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.state.error).not.toBeNull());

    act(() => result.current.actions.onResetSession());

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: {} }),
      undefined,
      { shallow: true }
    );
  });
});

const OPENED_ID = "opened111122223333444455556666777";
const SECOND_ID = "second111122223333444455556666777";

/**
 * A promise whose settling the test controls, to hold a request in flight.
 * @returns The promise and its resolve/reject handles
 */
function deferred<T>(): {
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

/**
 * A restore response for a conversation with one completed turn.
 * @param sessionId - Live session the conversation was restored into
 * @param reply - The assistant's reply, to tell conversations apart
 * @returns The payload assistantRestore resolves with
 */
function restoredConversation(
  sessionId: string,
  reply: string
): RestoreResponse {
  return {
    handoff_url: null,
    is_complete: false,
    messages: [
      { content: "hi", role: "user" },
      { content: reply, role: "assistant" },
    ],
    saved: true,
    saved_analysis_id: `analysis-${sessionId}`,
    schema_state: null,
    session_id: sessionId,
    suggestions: [],
  } as unknown as RestoreResponse;
}

/**
 * Renders the hook on the stored conversation and waits for it to restore,
 * with initialSessionId as a prop so a test can change the URL after mount.
 * @returns The renderHook result
 */
async function renderRestored(): Promise<
  ReturnType<
    typeof renderHook<
      ReturnType<typeof useAssistantChat>,
      { initialSessionId?: string }
    >
  >
> {
  localStorage.setItem(SESSION_KEY, STORED_ID);
  mockClient.assistantRestore.mockResolvedValueOnce(
    restoredConversation(STORED_ID, "stored reply")
  );
  const rendered = renderHook(
    ({ initialSessionId }: { initialSessionId?: string }) =>
      useAssistantChat({ initialSessionId, sessionKey: SESSION_KEY }),
    { initialProps: {} }
  );
  await waitFor(() =>
    expect(rendered.result.current.state.messages).toHaveLength(2)
  );
  return rendered;
}

/**
 * Opens a saved conversation as the history does, with the server opening it
 * into the given live session.
 * @param result - The rendered hook.
 * @param result.current - The hook's latest return.
 * @param sessionId - Live session the server opens the conversation into.
 * @returns Whether the open replaced the conversation showing.
 */
async function openConversation(
  result: { current: ReturnType<typeof useAssistantChat> },
  sessionId: string
): Promise<boolean> {
  mockApiClient.openSavedAnalysis.mockResolvedValueOnce({
    session_id: sessionId,
  } as Awaited<ReturnType<typeof mockApiClient.openSavedAnalysis>>);
  let opened = false;
  await act(async () => {
    opened = await result.current.actions.onOpenConversation(
      `analysis-${sessionId}`
    );
  });
  return opened;
}

describe("useAssistantChat switching conversations on the page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Drops responses a test queued for an open it then refused.
    mockApiClient.openSavedAnalysis.mockReset();
    localStorage.clear();
    mockQuery = {};
    mockIsReady = true;
  });

  test("starting a new analysis mid-restore leaves the input usable", async () => {
    // The restore the reset walked away from settles stale, so nothing it
    // finishes may clear or keep the flag; the reset itself must leave the
    // input usable.
    const { result } = await renderRestored();
    const opening = deferred<RestoreResponse>();
    mockClient.assistantRestore.mockReturnValueOnce(opening.promise);

    await openConversation(result, OPENED_ID);
    expect(result.current.state.isRestoring).toBe(true);

    act(() => result.current.actions.onResetSession());
    await act(async () => {
      opening.resolve(restoredConversation(OPENED_ID, "opened reply"));
    });

    expect(result.current.state.isRestoring).toBe(false);
    expect(result.current.state.messages).toEqual([]);
  });

  test("a reply for the conversation left behind does not land in the new one", async () => {
    const { result } = await renderRestored();
    const turn = deferred<ChatResponse>();
    mockClient.assistantChat.mockReturnValueOnce(turn.promise);
    let sending!: Promise<void>;
    act(() => {
      sending = result.current.actions.onSendMessage("still there?");
    });

    act(() => result.current.actions.onResetSession());
    await act(async () => {
      turn.resolve(chatResponse(STORED_ID, "late reply"));
      await sending;
    });

    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.shownSessionId).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(result.current.state.loading).toBe(false);
  });

  test("a conversation that fails to load for a transient reason is not shown as open", async () => {
    // The request keeps its session id so a retry can reach it, but nothing is
    // on screen -- so the history must not highlight it as the open one, or
    // picking it again to retry would do nothing.
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));

    await openConversation(result, OPENED_ID);
    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));

    expect(result.current.state.error).not.toBeNull();
    expect(result.current.state.shownSessionId).toBeNull();
  });

  test("a conversation that failed to load can be restored again on request", async () => {
    // Retry asks for the session the failed restore kept.
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));
    await openConversation(result, OPENED_ID);
    await waitFor(() => expect(result.current.actions.onRetry).toBeDefined());

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    await act(async () => {
      await result.current.actions.onRetry?.();
    });

    await waitFor(() =>
      expect(result.current.state.messages[1]?.content).toBe("opened reply")
    );
    expect(result.current.state.shownSessionId).toBe(OPENED_ID);
    expect(result.current.state.error).toBeNull();
  });

  test("a save that lands for the conversation left behind is reported against it", async () => {
    // The chat history checks the analysis saved, not the one showing, so a
    // first save that lands after the user moved on still joins the list.
    const { result } = await renderRestored();
    const turn = deferred<ChatResponse>();
    mockClient.assistantChat.mockReturnValueOnce(turn.promise);
    let sending!: Promise<void>;
    act(() => {
      sending = result.current.actions.onSendMessage("still there?");
    });

    act(() => result.current.actions.onResetSession());

    await act(async () => {
      turn.resolve({
        ...chatResponse(STORED_ID, "late reply"),
        saved: true,
        saved_analysis_id: "analysis-left-behind",
      });
      await sending;
    });

    expect(result.current.state.lastSave).toEqual({
      savedAnalysisId: "analysis-left-behind",
    });
  });

  test("a new analysis leaves the conversation's live session to expire", async () => {
    // The page can't always tell whether a conversation is saved, and deleting
    // a saved one's session would race reopening it -- so nothing is deleted.
    const { result } = await renderRestored();

    act(() => result.current.actions.onResetSession());

    expect(mockClient.assistantDeleteSession).not.toHaveBeenCalled();
  });
  test("a conversation that fails to open does not leave the previous one on screen", async () => {
    // Left behind, the previous conversation looked live but was cut off from
    // its session: the next message would start a new one with no context.
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(404));

    await openConversation(result, OPENED_ID);
    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));

    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.schema).toBeNull();
    expect(result.current.state.isSaved).toBe(false);
    expect(result.current.state.error).toMatch(/no longer available/i);
    // Nothing is shown, so the history highlights nothing and the conversation
    // can be picked again to retry.
    expect(result.current.state.shownSessionId).toBeNull();
  });

  test("starting a new analysis mid-restore does not bring the old conversation back", async () => {
    // A restore from localStorage has no URL parameter for the reset to strip,
    // so its effect never re-ran to cancel it and the response restored the
    // conversation just walked away from.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    const restoring = deferred<RestoreResponse>();
    mockClient.assistantRestore.mockReturnValueOnce(restoring.promise);
    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.state.isRestoring).toBe(true));

    act(() => result.current.actions.onResetSession());
    await act(async () => {
      restoring.resolve(restoredConversation(STORED_ID, "stored reply"));
    });

    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.shownSessionId).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  // The chat history selects the open conversation by its saved analysis id,
  // so that has to follow whichever conversation is on screen.

  test("a restore reports the saved analysis it brought back", async () => {
    const { result } = await renderRestored();

    expect(result.current.state.savedAnalysisId).toBe(`analysis-${STORED_ID}`);
  });

  test("a turn reports the saved analysis it belongs to", async () => {
    mockClient.assistantChat.mockResolvedValueOnce({
      ...chatResponse(STORED_ID, "ok"),
      saved_analysis_id: "analysis-first-save",
    });

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    expect(result.current.state.savedAnalysisId).toBeNull();

    await act(async () => {
      await result.current.actions.onSendMessage("hello");
    });

    expect(result.current.state.savedAnalysisId).toBe("analysis-first-save");
  });

  test("opening another conversation moves to its saved analysis", async () => {
    const { result } = await renderRestored();

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    await openConversation(result, OPENED_ID);

    await waitFor(() =>
      expect(result.current.state.savedAnalysisId).toBe(`analysis-${OPENED_ID}`)
    );
  });

  test("a new analysis has no saved analysis until it is saved", async () => {
    const { result } = await renderRestored();

    act(() => result.current.actions.onResetSession());

    expect(result.current.state.savedAnalysisId).toBeNull();
  });
});

describe("useAssistantChat opening a saved conversation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Drops responses a test queued for an open it then refused.
    mockApiClient.openSavedAnalysis.mockReset();
    localStorage.clear();
    mockQuery = {};
    mockIsReady = true;
  });

  test("opens it in place of the one showing and names its session in the URL", async () => {
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );

    const opened = await openConversation(result, OPENED_ID);

    expect(opened).toBe(true);
    expect(mockApiClient.openSavedAnalysis).toHaveBeenCalledWith(
      `analysis-${OPENED_ID}`
    );
    await waitFor(() =>
      expect(result.current.state.messages[1]?.content).toBe("opened reply")
    );
    expect(result.current.state.shownSessionId).toBe(OPENED_ID);
    // A reload restores what the URL names, so it must name the one opened.
    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: "/assistant", query: { sessionId: OPENED_ID } },
      undefined,
      { shallow: true }
    );
  });

  test("holds sends and new analyses until the open hands over to its restore", async () => {
    const { result } = await renderRestored();
    const opening =
      deferred<Awaited<ReturnType<typeof mockApiClient.openSavedAnalysis>>>();
    mockApiClient.openSavedAnalysis.mockReturnValueOnce(opening.promise);
    const restoring = deferred<RestoreResponse>();
    mockClient.assistantRestore.mockReturnValueOnce(restoring.promise);

    let open!: Promise<boolean>;
    act(() => {
      open = result.current.actions.onOpenConversation(`analysis-${OPENED_ID}`);
    });
    expect(result.current.state.isRestoring).toBe(true);

    await act(async () => {
      await result.current.actions.onSendMessage("over the top?");
    });
    let isReset = true;
    act(() => {
      isReset = result.current.actions.onResetSession();
    });

    expect(isReset).toBe(false);
    expect(mockClient.assistantChat).not.toHaveBeenCalled();
    // The conversation showing is untouched until the open replaces it.
    expect(result.current.state.shownSessionId).toBe(STORED_ID);
    expect(result.current.state.messages).toHaveLength(2);

    await act(async () => {
      opening.resolve({ session_id: OPENED_ID } as Awaited<
        ReturnType<typeof mockApiClient.openSavedAnalysis>
      >);
      await open;
    });

    // No gap between the open and its restore: the chat stays held until the
    // restore lands.
    expect(result.current.state.isRestoring).toBe(true);
    await act(async () => {
      restoring.resolve(restoredConversation(OPENED_ID, "opened reply"));
    });
    expect(result.current.state.isRestoring).toBe(false);
    expect(result.current.state.shownSessionId).toBe(OPENED_ID);
  });

  test("a failed open leaves the conversation showing as it was", async () => {
    const { result } = await renderRestored();
    const failure = new Error("500");
    mockApiClient.openSavedAnalysis.mockRejectedValueOnce(failure);

    let open!: Promise<boolean>;
    act(() => {
      open = result.current.actions.onOpenConversation(`analysis-${OPENED_ID}`);
    });
    await act(async () => {
      await expect(open).rejects.toBe(failure);
    });

    expect(result.current.state.isRestoring).toBe(false);
    expect(result.current.state.shownSessionId).toBe(STORED_ID);
    expect(result.current.state.messages[1]?.content).toBe("stored reply");
    expect(result.current.state.error).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockClient.assistantRestore).toHaveBeenCalledTimes(1);
  });

  test("opening the conversation already showing replaces nothing", async () => {
    const { result } = await renderRestored();

    const opened = await openConversation(result, STORED_ID);

    expect(opened).toBe(false);
    expect(mockClient.assistantRestore).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.state.messages[1]?.content).toBe("stored reply");
  });

  test("a conversation that failed to load restores when opened again", async () => {
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));
    await openConversation(result, OPENED_ID);
    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    const opened = await openConversation(result, OPENED_ID);

    expect(opened).toBe(true);
    await waitFor(() =>
      expect(result.current.state.messages[1]?.content).toBe("opened reply")
    );
    expect(result.current.state.error).toBeNull();
  });

  test("a URL naming another session after mount restores nothing", async () => {
    // Only the mount restores from the URL; an open writes the URL as its
    // output, and must not be restored a second time from it.
    const { rerender, result } = await renderRestored();

    rerender({ initialSessionId: OPENED_ID });

    expect(mockClient.assistantRestore).toHaveBeenCalledTimes(1);
    expect(result.current.state.shownSessionId).toBe(STORED_ID);
  });
  test("an open while a reply is in flight is refused, and the reply lands", async () => {
    const { result } = await renderRestored();
    const turn = deferred<ChatResponse>();
    mockClient.assistantChat.mockReturnValueOnce(turn.promise);
    let sending!: Promise<void>;
    act(() => {
      sending = result.current.actions.onSendMessage("still there?");
    });

    let opened = true;
    await act(async () => {
      opened = await result.current.actions.onOpenConversation(
        `analysis-${OPENED_ID}`
      );
    });
    await act(async () => {
      turn.resolve(chatResponse(STORED_ID, "reply"));
      await sending;
    });

    expect(opened).toBe(false);
    expect(mockApiClient.openSavedAnalysis).not.toHaveBeenCalled();
    expect(result.current.state.messages.map(({ content }) => content)).toEqual(
      ["hi", "stored reply", "still there?", "reply"]
    );
    expect(result.current.state.shownSessionId).toBe(STORED_ID);
  });

  test("names only the opened session in the URL", async () => {
    // Anything else left in the query outranks or displaces the session on a
    // reload -- a Logan job that failed to open would be retried over it.
    mockQuery = { loganJob: "job-1" };
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );

    await openConversation(result, OPENED_ID);

    expect(mockReplace).toHaveBeenLastCalledWith(
      { pathname: "/assistant", query: { sessionId: OPENED_ID } },
      undefined,
      { shallow: true }
    );
  });

  test("an open that settles after the page is left neither restores nor writes the URL", async () => {
    const { result, unmount } = await renderRestored();
    const opening =
      deferred<Awaited<ReturnType<typeof mockApiClient.openSavedAnalysis>>>();
    mockApiClient.openSavedAnalysis.mockReturnValueOnce(opening.promise);
    let open!: Promise<boolean>;
    act(() => {
      open = result.current.actions.onOpenConversation(`analysis-${OPENED_ID}`);
    });

    unmount();
    opening.resolve({ session_id: OPENED_ID } as Awaited<
      ReturnType<typeof mockApiClient.openSavedAnalysis>
    >);

    await expect(open).resolves.toBe(false);
    expect(mockClient.assistantRestore).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("a restore that settles after the page is left keeps the stored pointer", async () => {
    // Another mount may have stored a different conversation since; a late
    // restore for the page left behind must not overwrite it.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    const restoring = deferred<RestoreResponse>();
    mockClient.assistantRestore.mockReturnValueOnce(restoring.promise);
    const { unmount } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() =>
      expect(mockClient.assistantRestore).toHaveBeenCalledTimes(1)
    );

    unmount();
    localStorage.setItem(SESSION_KEY, OPENED_ID);
    await act(async () => {
      restoring.resolve(
        restoredConversation("late1111222233334444555566667777", "late")
      );
    });

    expect(localStorage.getItem(SESSION_KEY)).toBe(OPENED_ID);
  });

  test("retrying a stored pointer that turns out gone stays quiet", async () => {
    // A stale stored pointer going bad is routine, on a retry as on mount.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));
    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.actions.onRetry).toBeDefined());

    mockClient.assistantRestore.mockRejectedValueOnce(httpError(404));
    await act(async () => {
      await result.current.actions.onRetry?.();
    });

    await waitFor(() => expect(result.current.state.isRestoring).toBe(false));
    expect(result.current.state.error).toBeNull();
  });
  test("a mount restore lands through strict mode's effect replay", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(STORED_ID, "stored reply")
    );

    const { result } = renderHook(
      () => useAssistantChat({ sessionKey: SESSION_KEY }),
      { reactStrictMode: true }
    );

    await waitFor(() =>
      expect(result.current.state.messages[1]?.content).toBe("stored reply")
    );
    expect(result.current.state.isRestoring).toBe(false);
  });

  test("retrying a failure does nothing while a conversation is opening", async () => {
    // A restore retried over the open would discard it, though the server has
    // already moved the session cookie to the conversation being opened.
    const { result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));
    await openConversation(result, OPENED_ID);
    await waitFor(() => expect(result.current.actions.onRetry).toBeDefined());

    const opening =
      deferred<Awaited<ReturnType<typeof mockApiClient.openSavedAnalysis>>>();
    mockApiClient.openSavedAnalysis.mockReturnValueOnce(opening.promise);
    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(SECOND_ID, "second reply")
    );
    let open!: Promise<boolean>;
    act(() => {
      open = result.current.actions.onOpenConversation(`analysis-${SECOND_ID}`);
    });
    await act(async () => {
      await result.current.actions.onRetry?.();
    });
    expect(mockClient.assistantRestore).toHaveBeenCalledTimes(2);

    await act(async () => {
      opening.resolve({ session_id: SECOND_ID } as Awaited<
        ReturnType<typeof mockApiClient.openSavedAnalysis>
      >);
      await open;
    });

    await waitFor(() =>
      expect(result.current.state.messages[1]?.content).toBe("second reply")
    );
    expect(result.current.state.shownSessionId).toBe(SECOND_ID);
  });

  test("retrying a failed message does nothing while a conversation is opening", async () => {
    // Retrying would drop the failed message and its error, then find the send
    // refused -- losing both with nothing sent.
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(httpError(500));
    await act(async () => {
      await result.current.actions.onSendMessage("still there?");
    });
    expect(result.current.state.error).not.toBeNull();

    const opening =
      deferred<Awaited<ReturnType<typeof mockApiClient.openSavedAnalysis>>>();
    mockApiClient.openSavedAnalysis.mockReturnValueOnce(opening.promise);
    act(() => {
      void result.current.actions.onOpenConversation(`analysis-${OPENED_ID}`);
    });
    await act(async () => {
      await result.current.actions.onRetry?.();
    });

    expect(mockClient.assistantChat).toHaveBeenCalledTimes(1);
    expect(result.current.state.error).not.toBeNull();
    expect(result.current.state.messages.at(-1)?.content).toBe("still there?");
  });
});
