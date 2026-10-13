import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import { useLayoutTab } from "@repo/shared/views/AssistantView/components/Layout/hooks/UseLayoutTab/hook";
import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import { act, renderHook } from "@testing-library/react";
import type { SyntheticEvent } from "react";

const EVENT = {} as SyntheticEvent;

let scrollTo: jest.SpyInstance;

/**
 * Sets where the page is scrolled, as the browser would.
 * @param y - Vertical scroll position.
 */
function scrollPageTo(y: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
}

/**
 * Renders the hook for a conversation, so tests can move to another.
 * @param conversationKey - Key of the conversation shown first.
 * @returns The hook's result and a rerender that takes a new key.
 */
function renderLayoutTab(
  conversationKey = 0
): ReturnType<typeof renderHook<ReturnType<typeof useLayoutTab>, number>> {
  return renderHook((key: number) => useLayoutTab(key), {
    initialProps: conversationKey,
  });
}

/**
 * Switches tab, from wherever the page is scrolled.
 * @param result - Hook result.
 * @param result.current - Current hook value.
 * @param tab - Tab to switch to.
 */
function switchTo(
  result: { current: ReturnType<typeof useLayoutTab> },
  tab: LayoutTab
): void {
  act(() => result.current.onTabChange(EVENT, tab));
}

beforeEach(() => {
  scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  scrollPageTo(0);
});

afterEach(() => {
  scrollTo.mockRestore();
});

describe("useLayoutTab", () => {
  test("starts on the chat", () => {
    const { result } = renderLayoutTab();
    expect(result.current.tab).toBe(LAYOUT_TAB.CHAT);
  });

  // Leaves the page where the browser put it on arrival.
  test("doesn't scroll the page on mount", () => {
    renderLayoutTab();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("switches tab", () => {
    const { result } = renderLayoutTab();
    switchTo(result, LAYOUT_TAB.SETUP);
    expect(result.current.tab).toBe(LAYOUT_TAB.SETUP);
  });

  test("starts a tab not yet visited at the top", () => {
    const { result } = renderLayoutTab();
    scrollPageTo(500);
    switchTo(result, LAYOUT_TAB.HISTORY);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0 });
  });

  test("returns a tab to where it was left", () => {
    const { result } = renderLayoutTab();
    switchTo(result, LAYOUT_TAB.HISTORY);
    scrollPageTo(240);
    switchTo(result, LAYOUT_TAB.SETUP);
    scrollPageTo(80);
    switchTo(result, LAYOUT_TAB.HISTORY);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 240 });
  });

  test("brings the chat back when the user moves to a different conversation", () => {
    const { rerender, result } = renderLayoutTab(0);
    switchTo(result, LAYOUT_TAB.HISTORY);
    rerender(1);
    expect(result.current.tab).toBe(LAYOUT_TAB.CHAT);
  });

  test("keeps the tab when the conversation is unchanged", () => {
    const { rerender, result } = renderLayoutTab(0);
    switchTo(result, LAYOUT_TAB.SETUP);
    rerender(0);
    expect(result.current.tab).toBe(LAYOUT_TAB.SETUP);
  });

  // Positions belong to the conversation they were left in.
  test("starts tabs afresh in a different conversation", () => {
    const { rerender, result } = renderLayoutTab(0);
    switchTo(result, LAYOUT_TAB.SETUP);
    scrollPageTo(300);
    switchTo(result, LAYOUT_TAB.HISTORY);
    rerender(1);
    switchTo(result, LAYOUT_TAB.SETUP);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0 });
  });
});
