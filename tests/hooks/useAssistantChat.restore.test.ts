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
jest.mock("next/router", () => ({
  useRouter: (): {
    pathname: string;
    query: Record<string, string>;
    replace: jest.Mock;
  } => ({
    pathname: "/assistant",
    query: mockQuery,
    replace: mockReplace,
  }),
}));
// Keeps ESM-only ky out of the jest module graph, which it enters through the
// shared client the hook imports for saved analyses.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: { saveAnalysis: jest.fn() },
}));

const mockClient = assistantAPIClient as jest.Mocked<typeof assistantAPIClient>;

const SESSION_KEY = "brc-assistant-session-id";
const STORED_ID = "stored1111222233334444555566667777";

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
  });

  test("a 404 on a stored session clears the pointer without alarming the user", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(404));

    const { result } = renderHook(() => useAssistantChat({}));

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test("a 404 on a session named in the URL says so rather than rendering blank", async () => {
    mockClient.assistantRestore.mockRejectedValue(httpError(404));

    const { result } = renderHook(() =>
      useAssistantChat({ initialSessionId: STORED_ID })
    );

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(result.current.error).toMatch(/no longer available/i);
  });

  test("a 403 drops the pointer -- this browser can never restore that session", async () => {
    // The signing cookie no longer matches the id, which is permanent. Keeping
    // it would re-send the same id on every message and wedge the chat.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(403));

    const { result } = renderHook(() => useAssistantChat({}));

    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  test("a 429 keeps the pointer -- throttling is transient", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(429));

    const { result } = renderHook(() => useAssistantChat({}));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(localStorage.getItem(SESSION_KEY)).toBe(STORED_ID);
  });

  test("a 5xx keeps the pointer -- the session is probably still alive", async () => {
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(503));

    const { result } = renderHook(() => useAssistantChat({}));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(localStorage.getItem(SESSION_KEY)).toBe(STORED_ID);
  });

  test("after a 5xx the next message continues the kept session, not a new one", async () => {
    // Preserving the pointer is pointless if the next send ignores it: an
    // unadopted id sends session_id undefined, the server opens a fresh session
    // and success overwrites the very pointer we kept.
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockRejectedValue(httpError(503));
    mockClient.assistantChat.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      reply: "ok",
      schema_state: null,
      session_id: STORED_ID,
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantChat>>);

    const { result } = renderHook(() => useAssistantChat({}));
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
      useAssistantChat({ initialSessionId: STORED_ID })
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
