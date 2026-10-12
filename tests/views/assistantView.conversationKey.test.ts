import { useConversationKey } from "@repo/shared/views/AssistantView/hooks/UseConversationKey/hook";
import { act, renderHook } from "@testing-library/react";

// The conversation panel is keyed on this, so an unsent draft is dropped when
// the user moves to a different conversation and kept otherwise.
describe("useConversationKey", () => {
  test("starting a new analysis resets the session and moves the key", () => {
    const resetSession = jest.fn();
    const { result } = renderHook(() =>
      useConversationKey(resetSession, jest.fn())
    );
    const before = result.current.conversationKey;

    act(() => result.current.onNewAnalysis());

    expect(resetSession).toHaveBeenCalledTimes(1);
    expect(result.current.conversationKey).not.toBe(before);
  });

  test("opening a conversation from the history moves the key once", () => {
    const setIsOpening = jest.fn();
    const { result } = renderHook(() =>
      useConversationKey(jest.fn(), setIsOpening)
    );
    const before = result.current.conversationKey;

    act(() => result.current.onOpeningChange(true));
    const opened = result.current.conversationKey;
    act(() => result.current.onOpeningChange(false));

    expect(setIsOpening.mock.calls).toEqual([[true], [false]]);
    expect(opened).not.toBe(before);
    expect(result.current.conversationKey).toBe(opened);
  });

  test("keeps the key until the user moves to a different conversation", () => {
    const { rerender, result } = renderHook(() =>
      useConversationKey(jest.fn(), jest.fn())
    );
    const before = result.current.conversationKey;

    rerender();

    expect(result.current.conversationKey).toBe(before);
  });
});
