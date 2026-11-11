import { useConversationKey } from "@repo/shared/views/AssistantView/hooks/UseConversationKey/hook";
import { act, renderHook } from "@testing-library/react";

/**
 * Chat actions for the hook, each a spy: a reset that runs, and an open that
 * replaces the conversation showing.
 * @returns The actions.
 */
function actions(): {
  onOpenConversation: jest.Mock<Promise<boolean>, [string]>;
  onResetSession: jest.Mock<boolean, []>;
} {
  return {
    onOpenConversation: jest.fn().mockResolvedValue(true),
    onResetSession: jest.fn().mockReturnValue(true),
  };
}

// The conversation panel is keyed on this, so an unsent draft is dropped when
// the user moves to a different conversation and kept otherwise.
describe("useConversationKey", () => {
  test("starting a new analysis resets the session and moves the key", () => {
    const chat = actions();
    const { result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    act(() => result.current.onNewAnalysis());

    expect(chat.onResetSession).toHaveBeenCalledTimes(1);
    expect(result.current.conversationKey).not.toBe(before);
  });

  test("a new analysis held off by an open in flight keeps the key", () => {
    const chat = actions();
    chat.onResetSession.mockReturnValue(false);
    const { result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    act(() => result.current.onNewAnalysis());

    expect(result.current.conversationKey).toBe(before);
  });

  test("opening a different conversation from the history moves the key", async () => {
    const chat = actions();
    const { result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    await act(async () => {
      await result.current.onOpenConversation("analysis-1");
    });

    expect(chat.onOpenConversation).toHaveBeenCalledWith("analysis-1");
    expect(result.current.conversationKey).not.toBe(before);
  });

  test("an open that replaces nothing keeps the key", async () => {
    const chat = actions();
    chat.onOpenConversation.mockResolvedValue(false);
    const { result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    await act(async () => {
      await result.current.onOpenConversation("analysis-1");
    });

    expect(result.current.conversationKey).toBe(before);
  });

  test("an open that fails passes the failure on and keeps the key", async () => {
    const chat = actions();
    const failure = new Error("500");
    chat.onOpenConversation.mockRejectedValue(failure);
    const { result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    await act(async () => {
      await expect(
        result.current.onOpenConversation("analysis-1")
      ).rejects.toBe(failure);
    });

    expect(result.current.conversationKey).toBe(before);
  });

  test("keeps the key until the user moves to a different conversation", () => {
    const chat = actions();
    const { rerender, result } = renderHook(() => useConversationKey(chat));
    const before = result.current.conversationKey;

    rerender();

    expect(result.current.conversationKey).toBe(before);
  });
});
