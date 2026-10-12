import { useConversationKey } from "@repo/shared/views/AssistantView/hooks/UseConversationKey/hook";
import { act, renderHook } from "@testing-library/react";

// The conversation panel is keyed on this, so an unsent draft is dropped when
// the user moves to a different conversation and kept otherwise.
describe("useConversationKey", () => {
  test("starting a new analysis resets the session and moves the key", () => {
    const resetSession = jest.fn();
    const { result } = renderHook(() => useConversationKey(resetSession));
    const before = result.current.conversationKey;

    act(() => result.current.onNewAnalysis());

    expect(resetSession).toHaveBeenCalledTimes(1);
    expect(result.current.conversationKey).not.toBe(before);
  });

  test("opening a different conversation from the history moves the key", () => {
    const { result } = renderHook(() => useConversationKey(jest.fn()));
    const before = result.current.conversationKey;

    act(() => result.current.onOpened());

    expect(result.current.conversationKey).not.toBe(before);
  });

  test("keeps the key until the user moves to a different conversation", () => {
    const { rerender, result } = renderHook(() =>
      useConversationKey(jest.fn())
    );
    const before = result.current.conversationKey;

    rerender();

    expect(result.current.conversationKey).toBe(before);
  });
});
