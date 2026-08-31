import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { renderHook, waitFor } from "@testing-library/react";

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
// Keeps ESM-only ky out of the jest module graph, which it enters through the
// shared client the hook imports for saved analyses.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: { saveAnalysis: jest.fn() },
}));

const mockClient = assistantAPIClient as jest.Mocked<typeof assistantAPIClient>;

const SESSION_KEY = "brc-assistant-session-id";
const STORED_ID = "stored1111222233334444555566667777";
const QUESTION = "Which assemblies exist for P. falciparum?";

describe("useAssistantChat initial message", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockQuery = { q: QUESTION };
    mockIsReady = true;
    mockClient.assistantChat.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      reply: "ok",
      schema_state: null,
      session_id: "new11111222233334444555566667777",
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantChat>>);
  });

  test("asks the handed-over question", async () => {
    const { result } = renderHook(() =>
      useAssistantChat({ initialMessage: QUESTION, sessionKey: SESSION_KEY })
    );

    await waitFor(() =>
      expect(mockClient.assistantChat).toHaveBeenCalledWith(
        expect.objectContaining({ message: QUESTION })
      )
    );
    expect(result.current.messages[0]).toEqual({
      content: QUESTION,
      role: "user",
    });
  });

  test("asks it once, however often the hook re-renders", async () => {
    const { rerender } = renderHook(() =>
      useAssistantChat({ initialMessage: QUESTION, sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(mockClient.assistantChat).toHaveBeenCalled());
    rerender();
    rerender();

    expect(mockClient.assistantChat).toHaveBeenCalledTimes(1);
  });

  test("opens a new conversation rather than resuming the stored one", async () => {
    // Grafting the question onto a stale session would answer it in the context
    // of whatever the user was doing days ago.
    localStorage.setItem(SESSION_KEY, STORED_ID);

    renderHook(() =>
      useAssistantChat({ initialMessage: QUESTION, sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(mockClient.assistantChat).toHaveBeenCalled());
    expect(mockClient.assistantRestore).not.toHaveBeenCalled();
    expect(mockClient.assistantChat).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: undefined })
    );
  });

  test("strips the question from the URL so a reload doesn't ask it again", async () => {
    renderHook(() =>
      useAssistantChat({ initialMessage: QUESTION, sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: {} }),
      undefined,
      { shallow: true }
    );
  });

  test("keeps the asked question after the URL drops it", async () => {
    // Asking strips ?q= from the URL, which hands the hook `undefined` on the
    // next render. Re-reading that as "no question" would restore the previous
    // conversation over the top of the one just started -- the asked question
    // vanishes and its answer lands under the earlier exchange.
    localStorage.setItem(SESSION_KEY, STORED_ID);

    const { rerender, result } = renderHook(
      ({ initialMessage }: { initialMessage?: string }) =>
        useAssistantChat({ initialMessage, sessionKey: SESSION_KEY }),
      { initialProps: { initialMessage: QUESTION as string | undefined } }
    );

    await waitFor(() => expect(mockClient.assistantChat).toHaveBeenCalled());
    mockQuery = {};
    rerender({ initialMessage: undefined });

    await waitFor(() =>
      expect(result.current.messages[0]).toEqual({
        content: QUESTION,
        role: "user",
      })
    );
    expect(mockClient.assistantRestore).not.toHaveBeenCalled();
  });

  test("waits for the router before restoring, so it can see the question", async () => {
    // On a cold load the query is empty until the router settles. Restoring on
    // that first pass would race the question the URL is about to name.
    mockIsReady = false;
    localStorage.setItem(SESSION_KEY, STORED_ID);

    const { rerender } = renderHook(
      ({ initialMessage }: { initialMessage?: string }) =>
        useAssistantChat({ initialMessage, sessionKey: SESSION_KEY }),
      { initialProps: { initialMessage: undefined as string | undefined } }
    );

    expect(mockClient.assistantRestore).not.toHaveBeenCalled();

    mockIsReady = true;
    rerender({ initialMessage: QUESTION });

    await waitFor(() => expect(mockClient.assistantChat).toHaveBeenCalled());
    expect(mockClient.assistantRestore).not.toHaveBeenCalled();
  });

  test("leaves a session named in the URL behind rather than posting into it", async () => {
    // ?q= alongside ?sessionId= skips the restore, so continuing that session
    // would post the question into a conversation whose history was never
    // loaded -- neither a new conversation nor a resumed one.
    mockQuery = { q: QUESTION, sessionId: STORED_ID };

    renderHook(() =>
      useAssistantChat({
        initialMessage: QUESTION,
        initialSessionId: STORED_ID,
        sessionKey: SESSION_KEY,
      })
    );

    await waitFor(() => expect(mockClient.assistantChat).toHaveBeenCalled());
    expect(mockClient.assistantRestore).not.toHaveBeenCalled();
    expect(mockClient.assistantChat).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: undefined })
    );
  });

  test("takes ?sessionId= off the URL with the question", async () => {
    // The session the question displaced outranks the stored pointer on mount,
    // so leaving it in the URL means a reload restores the very conversation
    // that was walked away from and orphans the one the question opened.
    mockQuery = { q: QUESTION, sessionId: STORED_ID };

    renderHook(() =>
      useAssistantChat({
        initialMessage: QUESTION,
        initialSessionId: STORED_ID,
        sessionKey: SESSION_KEY,
      })
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: {} }),
      undefined,
      { shallow: true }
    );
  });

  test("treats a question of whitespace as no question at all", async () => {
    // It would never be asked (sending trims), so acting on it would strip the
    // param, abandon the stored session and leave a blank conversation behind.
    mockQuery = { q: "   " };
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      messages: [],
      schema_state: null,
      session_id: STORED_ID,
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantRestore>>);

    renderHook(() =>
      useAssistantChat({ initialMessage: "   ", sessionKey: SESSION_KEY })
    );

    await waitFor(() => expect(mockClient.assistantRestore).toHaveBeenCalled());
    expect(mockClient.assistantChat).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("restores the stored session when no question was handed over", async () => {
    mockQuery = {};
    localStorage.setItem(SESSION_KEY, STORED_ID);
    mockClient.assistantRestore.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      messages: [],
      schema_state: null,
      session_id: STORED_ID,
      suggestions: [],
    } as unknown as Awaited<ReturnType<typeof mockClient.assistantRestore>>);

    renderHook(() => useAssistantChat({ sessionKey: SESSION_KEY }));

    await waitFor(() => expect(mockClient.assistantRestore).toHaveBeenCalled());
    expect(mockClient.assistantChat).not.toHaveBeenCalled();
  });
});
