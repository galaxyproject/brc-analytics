import type {
  AnalysisSchema,
  SessionRestoreResponse,
} from "@repo/shared/services/api-client/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@repo/shared/services/assistant-api-client", () => ({
  assistantAPIClient: {
    assistantChat: jest.fn(),
    assistantClearField: jest.fn(),
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

  test("clears through the direct call, not a chat turn", async () => {
    const { result } = await renderRestored();
    mockClient.assistantClearField.mockResolvedValue(session());

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(mockClient.assistantClearField).toHaveBeenCalledWith(SESSION_ID, {
      field: "organism",
    });
    expect(mockClient.assistantChat).not.toHaveBeenCalled();
  });

  test("takes the server's schema and transcript, cascade and note included", async () => {
    const { result } = await renderRestored();
    const cleared = session({
      messages: [
        ...session().messages,
        {
          content: "Organism cleared, along with assembly and workflow.",
          role: "system",
        },
      ],
      schema_state: {
        ...SCHEMA,
        assembly: EMPTY,
        organism: EMPTY,
        workflow: EMPTY,
      },
    });
    mockClient.assistantClearField.mockResolvedValue(cleared);

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(result.current.schema).toEqual(cleared.schema_state);
    expect(result.current.messages).toEqual(cleared.messages);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("reports a failed clear and leaves the field as it was", async () => {
    const { result } = await renderRestored();
    mockClient.assistantClearField.mockRejectedValue(new Error("500"));

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(result.current.error).toMatch(/couldn't clear/i);
    expect(result.current.schema).toEqual(SCHEMA);
    expect(result.current.loading).toBe(false);
  });

  test("does nothing without a session to clear on", async () => {
    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );

    await act(async () => {
      await result.current.clearField("organism");
    });

    expect(mockClient.assistantClearField).not.toHaveBeenCalled();
  });

  test("holds off while a reply is in flight", async () => {
    const { result } = await renderRestored();
    let finishTurn: () => void = () => undefined;
    mockClient.assistantChat.mockReturnValue(
      new Promise((resolve) => {
        finishTurn = (): void =>
          resolve({
            handoff_url: null,
            is_complete: false,
            reply: "ok",
            saved: false,
            schema_state: SCHEMA,
            session_id: SESSION_ID,
            suggestions: [],
          });
      })
    );

    let turn: Promise<void> = Promise.resolve();
    act(() => {
      turn = result.current.sendMessage("hello");
    });
    await act(async () => {
      await result.current.clearField("organism");
    });
    expect(mockClient.assistantClearField).not.toHaveBeenCalled();

    await act(async () => {
      finishTurn();
      await turn;
    });
  });

  test("keeps a message that failed to send, and its retry", async () => {
    const { result } = await renderRestored();
    mockClient.assistantChat.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      await result.current.sendMessage("try the other assembly");
    });
    expect(result.current.onRetry).toBeDefined();

    mockClient.assistantClearField.mockResolvedValue(
      session({
        messages: [
          ...session().messages,
          { content: "Data source cleared.", role: "system" },
        ],
      })
    );
    await act(async () => {
      await result.current.clearField("data_source");
    });

    expect(result.current.messages.at(-1)).toEqual({
      content: "try the other assembly",
      role: "user",
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.onRetry).toBeDefined();

    mockClient.assistantChat.mockResolvedValue({
      handoff_url: null,
      is_complete: false,
      reply: "ok",
      saved: false,
      schema_state: SCHEMA,
      session_id: SESSION_ID,
      suggestions: [],
    });
    await act(async () => {
      await result.current.onRetry?.();
    });
    // Retry resent the failed message and left the clear's note alone.
    expect(mockClient.assistantChat).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "try the other assembly" })
    );
    expect(result.current.messages.map((m) => m.content)).toEqual([
      "Variant calling in P. falciparum",
      "Sounds good.",
      "Data source cleared.",
      "try the other assembly",
      "ok",
    ]);
  });
});
