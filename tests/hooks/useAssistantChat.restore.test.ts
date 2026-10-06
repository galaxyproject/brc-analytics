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

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test("a 404 on a session named in the URL says so rather than rendering blank", async () => {
    mockClient.assistantRestore.mockRejectedValue(httpError(404));

    const { result } = renderHook(() =>
      useAssistantChat({ initialSessionId: STORED_ID, sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(result.current.error).toMatch(/no longer available/i);
  });

  test("a 403 drops the pointer -- this browser can never restore that session", async () => {
    // The signing cookie no longer matches the id, which is permanent. Keeping
    // it would re-send the same id on every message and wedge the chat.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(403));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  test("a 429 keeps the pointer -- throttling is transient", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(429));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(localStorage.getItem(SESSION_KEY)).toBe(STORED_ID);
  });

  test("a 5xx keeps the pointer -- the session is probably still alive", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(503));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
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
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      await result.current.sendMessage("still there?");
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
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.resetSession());

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: {} }),
      undefined,
      { shallow: true }
    );
  });
});

const OPENED_ID = "opened111122223333444455556666777";

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
    schema_state: null,
    session_id: sessionId,
    suggestions: [],
  } as unknown as RestoreResponse;
}

/**
 * Renders the hook on the stored conversation and waits for it to restore,
 * with initialSessionId as a prop so a test can navigate to another one.
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
  await waitFor(() => expect(rendered.result.current.messages).toHaveLength(2));
  return rendered;
}

describe("useAssistantChat switching conversations on the page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockQuery = {};
    mockIsReady = true;
  });

  test("starting a new analysis mid-restore leaves the input usable", async () => {
    // The reset drops ?sessionId=, which cancels the restore's effect run and
    // re-runs it with nothing to restore. Nothing else clears the flag, so the
    // chat input stayed disabled until a reload.
    const { rerender, result } = await renderRestored();
    const opening = deferred<RestoreResponse>();
    mockClient.assistantRestore.mockReturnValueOnce(opening.promise);

    mockQuery = { sessionId: OPENED_ID };
    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() => expect(result.current.isRestoring).toBe(true));

    act(() => result.current.resetSession());
    mockQuery = {};
    rerender({});
    await act(async () => {
      opening.resolve(restoredConversation(OPENED_ID, "opened reply"));
    });

    expect(result.current.isRestoring).toBe(false);
    expect(result.current.messages).toEqual([]);
  });

  test("a reply for the conversation left behind does not land in the one opened", async () => {
    const { rerender, result } = await renderRestored();
    const turn = deferred<ChatResponse>();
    mockClient.assistantChat.mockReturnValueOnce(turn.promise);
    let sending!: Promise<void>;
    act(() => {
      sending = result.current.sendMessage("still there?");
    });

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() =>
      expect(result.current.messages[1]?.content).toBe("opened reply")
    );

    await act(async () => {
      turn.resolve(chatResponse(STORED_ID, "late reply"));
      await sending;
    });

    expect(result.current.messages.map(({ content }) => content)).toEqual([
      "hi",
      "opened reply",
    ]);
    expect(result.current.shownSessionId).toBe(OPENED_ID);
    expect(localStorage.getItem(SESSION_KEY)).toBe(OPENED_ID);
    expect(result.current.loading).toBe(false);
  });

  test("a conversation that fails to load for a transient reason is not shown as open", async () => {
    // The request keeps its session id so a retry can reach it, but nothing is
    // on screen -- so the history must not highlight it as the open one, or
    // picking it again to retry would do nothing.
    const { rerender, result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));

    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.shownSessionId).toBeNull();
  });

  test("a conversation that failed to load can be restored again on request", async () => {
    // The URL already names the session, so nothing changes to re-run the
    // restore on its own: Retry (and picking it again in the history) asks.
    const { rerender, result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(503));
    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() => expect(result.current.onRetry).toBeDefined());

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    await act(async () => {
      await result.current.onRetry?.();
    });

    await waitFor(() =>
      expect(result.current.messages[1]?.content).toBe("opened reply")
    );
    expect(result.current.shownSessionId).toBe(OPENED_ID);
    expect(result.current.error).toBeNull();
  });

  test("a save that lands for the conversation left behind is reported against it", async () => {
    // The chat history checks the session saved, not the one showing, so a
    // first save that lands after the user moved on still joins the list.
    const { rerender, result } = await renderRestored();
    const turn = deferred<ChatResponse>();
    mockClient.assistantChat.mockReturnValueOnce(turn.promise);
    let sending!: Promise<void>;
    act(() => {
      sending = result.current.sendMessage("still there?");
    });

    mockClient.assistantRestore.mockResolvedValueOnce(
      restoredConversation(OPENED_ID, "opened reply")
    );
    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() => expect(result.current.shownSessionId).toBe(OPENED_ID));

    await act(async () => {
      turn.resolve({ ...chatResponse(STORED_ID, "late reply"), saved: true });
      await sending;
    });

    expect(result.current.lastSave).toEqual({ sessionId: STORED_ID });
  });

  test("a new analysis leaves the conversation's live session to expire", async () => {
    // The page can't always tell whether a conversation is saved, and deleting
    // a saved one's session would race reopening it -- so nothing is deleted.
    const { result } = await renderRestored();

    act(() => result.current.resetSession());

    expect(mockClient.assistantDeleteSession).not.toHaveBeenCalled();
  });
  test("a conversation that fails to open does not leave the previous one on screen", async () => {
    // Left behind, the previous conversation looked live but was cut off from
    // its session: the next message would start a new one with no context.
    const { rerender, result } = await renderRestored();
    mockClient.assistantRestore.mockRejectedValueOnce(httpError(404));

    rerender({ initialSessionId: OPENED_ID });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    expect(result.current.messages).toEqual([]);
    expect(result.current.schema).toBeNull();
    expect(result.current.isSaved).toBe(false);
    expect(result.current.error).toMatch(/no longer available/i);
    // Nothing is shown, so the history highlights nothing and the conversation
    // can be picked again to retry.
    expect(result.current.shownSessionId).toBeNull();
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
    await waitFor(() => expect(result.current.isRestoring).toBe(true));

    act(() => result.current.resetSession());
    await act(async () => {
      restoring.resolve(restoredConversation(STORED_ID, "stored reply"));
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.shownSessionId).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
