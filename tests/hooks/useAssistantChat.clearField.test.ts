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
    schema_state: SCHEMA,
    session_id: SESSION_ID,
    suggestions: [],
    ...overrides,
  };
}

const CLEARED: AnalysisSchema = {
  ...SCHEMA,
  assembly: EMPTY,
  organism: EMPTY,
  workflow: EMPTY,
};

const NOTE = "Organism cleared, along with assembly and workflow.";

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
  await waitFor(() => expect(rendered.result.current.schema).not.toBeNull());
  return rendered;
}

describe("useAssistantChat clearField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("clears as structured data on a chat turn, with no message", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockResolvedValue(turn());

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(mockClient.assistantChat).toHaveBeenCalledWith({
      clear_fields: ["organism"],
      message: undefined,
      session_id: SESSION_ID,
    });
  });

  test("shows the note then the reply, and takes the server's schema", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockResolvedValue(
      turn({ note: NOTE, schema_state: CLEARED })
    );

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(result.current.messages.slice(2)).toEqual([
      { content: NOTE, role: "system" },
      { content: "Which organism instead?", role: "assistant" },
    ]);
    expect(result.current.schema).toEqual(CLEARED);
    expect(result.current.loading).toBe(false);
  });

  test("a message turn with a note puts the note before the user's line", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockResolvedValue(turn({ note: NOTE }));

    await act(async () => {
      await result.current.sendMessage("try yeast");
    });

    expect(result.current.messages.slice(2).map((m) => m.role)).toEqual([
      "system",
      "user",
      "assistant",
    ]);
  });

  test("a failed clear can be retried, and leaves the field as it was", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(new Error("network"));

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.schema).toEqual(SCHEMA);
    // A clear adds no line of its own, so nothing is left to pop on retry.
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.onRetry).toBeDefined();

    mockClient.assistantChat.mockResolvedValue(
      turn({ note: NOTE, schema_state: CLEARED })
    );
    await act(async () => {
      await result.current.onRetry?.();
    });

    expect(mockClient.assistantChat).toHaveBeenLastCalledWith(
      expect.objectContaining({ clear_fields: ["organism"] })
    );
    expect(result.current.messages.map((m) => m.content)).toEqual([
      "Variant calling in P. falciparum",
      "Sounds good.",
      NOTE,
      "Which organism instead?",
    ]);
    expect(result.current.schema).toEqual(CLEARED);
  });

  test("does nothing without a session to clear on", async () => {
    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(mockClient.assistantChat).not.toHaveBeenCalled();
  });

  test("holds off while a reply is in flight", async () => {
    const { result } = await renderRestored();
    let finishTurn: () => void = () => undefined;
    mockClient.assistantChat.mockReturnValueOnce(
      new Promise((resolve) => {
        finishTurn = (): void => resolve(turn({ reply: "ok" }));
      })
    );

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.sendMessage("hello");
    });
    await act(async () => {
      await result.current.clearField("organism");
    });
    expect(mockClient.assistantChat).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishTurn();
      await pending;
    });
  });
});
