import { useAuth } from "@repo/shared/providers/authentication/provider";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@repo/shared/services/assistant-api-client", () => ({
  assistantAPIClient: {
    assistantChat: jest.fn(),
    assistantDeleteSession: jest.fn().mockResolvedValue(undefined),
    assistantRestore: jest.fn(),
    assistantSaveSession: jest.fn(),
  },
}));
jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("next/router", () => ({
  useRouter: (): {
    isReady: boolean;
    pathname: string;
    query: Record<string, string>;
    replace: jest.Mock;
  } => ({
    isReady: true,
    pathname: "/assistant",
    query: {},
    replace: jest.fn().mockResolvedValue(true),
  }),
}));

const mockClient = assistantAPIClient as jest.Mocked<typeof assistantAPIClient>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const SESSION_KEY = "brc-assistant-session-id";
const STORED_ID = "stored1111222233334444555566667777";

/**
 * Shaped like the ky HTTPError the client throws -- the hook reads
 * `.response.status` to tell a permanent refusal from a transient one.
 * @param status - HTTP status to attach
 * @returns An error carrying that status
 */
function httpError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`${status}`), { response: { status } });
}

/**
 * A chat response for the turn that re-runs the auto-save effect.
 * @returns The payload assistantChat resolves with
 */
function chatReply(): Awaited<ReturnType<typeof mockClient.assistantChat>> {
  return {
    handoff_url: null,
    is_complete: false,
    reply: "ok",
    saved: false,
    schema_state: null,
    session_id: STORED_ID,
    suggestions: [],
  } as unknown as Awaited<ReturnType<typeof mockClient.assistantChat>>;
}

/**
 * Put the hook in a given auth state.
 * @param isAuthenticated - Whether someone is signed in
 */
function auth(isAuthenticated: boolean): void {
  mockUseAuth.mockReturnValue({
    isAuthenticated,
    isConfigured: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
  });
}

/**
 * A restore response carrying one completed turn.
 * @returns The payload assistantRestore resolves with
 */
function restored(): Awaited<ReturnType<typeof mockClient.assistantRestore>> {
  return {
    handoff_url: null,
    is_complete: false,
    messages: [
      { content: "hi", role: "user" },
      { content: "hello back", role: "assistant" },
    ],
    saved: false,
    schema_state: null,
    session_id: STORED_ID,
    suggestions: [],
  } as unknown as Awaited<ReturnType<typeof mockClient.assistantRestore>>;
}

describe("useAssistantChat auto-save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockResolvedValue(restored());
    mockClient.assistantSaveSession.mockResolvedValue({
      saved_analysis_id: "analysis-1",
    });
  });

  test("signing in keeps the conversation without waiting for another turn", async () => {
    // The sign-in prompt promises this. Auto-save only runs on chat turns, so
    // without the explicit save the conversation dies with its session TTL.
    auth(true);

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.isSaved).toBe(true));
    expect(mockClient.assistantSaveSession).toHaveBeenCalledWith(STORED_ID);
  });

  test("a conversation the server already has is not saved again", async () => {
    // Auth state answers "who is this", not "is this kept". Inferring the
    // second from the first re-saved every signed-in session on every mount --
    // which against a deployment with no database is three 503s and three
    // exception logs a visit, and against one with a database is a third
    // writer racing the turn that is already saving.
    auth(true);
    mockClient.assistantRestore.mockResolvedValue({
      ...restored(),
      saved: true,
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantRestore>>);

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.isSaved).toBe(true));
    expect(mockClient.assistantSaveSession).not.toHaveBeenCalled();
  });

  test("a signed-out conversation is never sent to the account", async () => {
    auth(false);

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(mockClient.assistantSaveSession).not.toHaveBeenCalled();
    expect(result.current.isSaved).toBe(false);
  });

  test("a failed save leaves the label off rather than claiming otherwise", async () => {
    auth(true);
    mockClient.assistantSaveSession.mockRejectedValue(new Error("no database"));

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() =>
      expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1)
    );
    expect(result.current.isSaved).toBe(false);
  });

  test("a save that could succeed later is tried again", async () => {
    // The latch goes down before the request goes out, so leaving it down
    // after a transient failure means this session is never saved again --
    // and this effect exists for the user who signed in to keep what is on
    // screen and then sends nothing more.
    auth(true);
    mockClient.assistantSaveSession.mockRejectedValue(
      new Error("network down")
    );
    mockClient.assistantChat.mockResolvedValue(chatReply());

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() =>
      expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1)
    );

    await act(async () => {
      await result.current.sendMessage("still here");
    });

    await waitFor(() =>
      expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(2)
    );
  });

  test("a deployment that cannot save is not asked twice", async () => {
    // 501 is the answer for a deployment with OIDC on and no database. No
    // retry changes it, so the latch stays down and the requests stop.
    auth(true);
    mockClient.assistantSaveSession.mockRejectedValue(httpError(501));
    mockClient.assistantChat.mockResolvedValue(chatReply());

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() =>
      expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1)
    );

    await act(async () => {
      await result.current.sendMessage("still here");
    });

    expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1);
  });

  test("a turn is only called saved when the backend says it wrote it", async () => {
    auth(true);
    localStorage.clear();
    // Take the explicit save out of play so the assertion can only be reading
    // the chat response's own flag.
    mockClient.assistantSaveSession.mockRejectedValue(new Error("no database"));
    mockClient.assistantChat.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      reply: "ok",
      saved: false,
      schema_state: null,
      session_id: STORED_ID,
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantChat>>);

    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.isSaved).toBe(false);

    mockClient.assistantChat.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      reply: "ok",
      saved: true,
      schema_state: null,
      session_id: STORED_ID,
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantChat>>);
    await act(async () => {
      await result.current.sendMessage("again");
    });

    expect(result.current.isSaved).toBe(true);
  });

  test("the save is attempted once per session, not once per render", async () => {
    auth(true);
    mockClient.assistantSaveSession.mockRejectedValue(httpError(501));

    const { rerender, result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await waitFor(() =>
      expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1)
    );
    rerender();
    rerender();

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(mockClient.assistantSaveSession).toHaveBeenCalledTimes(1);
  });
});
