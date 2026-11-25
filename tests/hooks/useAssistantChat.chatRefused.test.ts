import type {
  AnalysisSchema,
  AssistantChatResponse,
  SessionRestoreResponse,
} from "@repo/shared/services/api-client/types";
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

const SESSION_KEY = "brc-assistant-session-id";
const SESSION_ID = "sess1111222233334444555566667777";

const EMPTY = { detail: null, status: "empty", value: null } as const;
const FILLED = (value: string): AnalysisSchema["organism"] => ({
  detail: null,
  status: "filled",
  value,
});

const SCHEMA: AnalysisSchema = {
  analysis_type: FILLED("Variant calling"),
  assembly: FILLED("Pf3D7"),
  data_characteristics: EMPTY,
  data_source: EMPTY,
  gene_annotation: EMPTY,
  organism: FILLED("Plasmodium falciparum"),
  workflow: FILLED("Haploid variant calling"),
};

/**
 * A session as the restore and clear-field endpoints return it.
 * @param overrides - Fields to replace.
 * @returns A session response.
 */
function session(
  overrides: Partial<SessionRestoreResponse> = {}
): SessionRestoreResponse {
  return {
    handoff_url: null,
    is_complete: false,
    messages: [
      { content: "Variant calling in P. falciparum", role: "user" },
      { content: "Sounds good.", role: "assistant" },
    ],
    saved: false,
    saved_analysis_id: null,
    schema_state: SCHEMA,
    session_id: SESSION_ID,
    suggestions: [],
    ...overrides,
  };
}

/**
 * A chat turn's response.
 * @param overrides - Fields to replace.
 * @returns A chat response.
 */
function turn(
  overrides: Partial<AssistantChatResponse> = {}
): AssistantChatResponse {
  return {
    handoff_url: null,
    is_complete: false,
    reply: "Which organism instead?",
    saved: false,
    saved_analysis_id: null,
    schema_state: SCHEMA,
    session_id: SESSION_ID,
    suggestions: [],
    ...overrides,
  };
}

/**
 * Render the hook on a restored session, waiting for the restore to land.
 * @returns The rendered hook.
 */
async function renderRestored(): Promise<
  ReturnType<typeof renderHook<ReturnType<typeof useAssistantChat>, unknown>>
> {
  localStorage.setItem(SESSION_KEY, SESSION_ID);
  mockClient.assistantRestore.mockResolvedValue(session());
  const rendered = renderHook(() =>
    useAssistantChat({ sessionKey: SESSION_KEY })
  );
  await waitFor(() =>
    expect(rendered.result.current.state.schema).not.toBeNull()
  );
  return rendered;
}

/**
 * An HTTP error as ky throws it, carrying the response status.
 * @param status - HTTP status.
 * @returns The error.
 */
function httpError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`${status}`), { response: { status } });
}

describe("useAssistantChat when a turn is refused with 403", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("starts a new conversation and says why", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(httpError(403));

    await act(async () => {
      await result.current.actions.onSendMessage("and now?");
    });

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.schema).toBeNull();
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBe(
      "That conversation can't be continued, so a new one has started."
    );
    expect(result.current.actions.onRetry).toBeUndefined();
  });

  test("opens a fresh session with the next message", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(httpError(403));
    await act(async () => {
      await result.current.actions.onSendMessage("and now?");
    });
    mockClient.assistantChat.mockResolvedValueOnce(
      turn({ session_id: "fresh000000000000000000000000000" })
    );

    await act(async () => {
      await result.current.actions.onSendMessage("start over");
    });

    expect(mockClient.assistantChat).toHaveBeenLastCalledWith({
      clear_fields: undefined,
      message: "start over",
      session_id: undefined,
    });
  });

  test("keeps the session and offers a retry on a server error", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(httpError(500));

    await act(async () => {
      await result.current.actions.onSendMessage("and now?");
    });

    expect(localStorage.getItem(SESSION_KEY)).toBe(SESSION_ID);
    expect(result.current.actions.onRetry).toBeDefined();
  });
});
