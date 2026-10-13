import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import { useLayoutTab } from "@repo/shared/views/AssistantView/components/Layout/hooks/UseLayoutTab/hook";
import type { LayoutTab } from "@repo/shared/views/AssistantView/components/Layout/types";
import {
  getTabId,
  getTabPanelId,
} from "@repo/shared/views/AssistantView/components/Layout/utils";
import { act, renderHook } from "@testing-library/react";
import type { SyntheticEvent } from "react";

const BASE_ID = "layout";

const EVENT = {} as SyntheticEvent;

let scrollTo: jest.SpyInstance;

/**
 * Adds a button to the page, inside a column's panel or on its own.
 * @param id - Button id.
 * @param panelTab - Column whose panel holds the button, if any.
 * @returns The button.
 */
function addButton(id: string, panelTab?: LayoutTab): HTMLButtonElement {
  const button = document.createElement("button");
  button.id = id;
  if (!panelTab) {
    document.body.append(button);
    return button;
  }
  const panel = document.createElement("div");
  panel.id = getTabPanelId(BASE_ID, panelTab);
  panel.append(button);
  document.body.append(panel);
  return button;
}

/**
 * Renders the hook for a conversation, so tests can move to another.
 * @param conversationKey - Key of the conversation shown first.
 * @returns The hook's result and a rerender that takes a new key.
 */
function renderLayoutTab(
  conversationKey = 0
): ReturnType<typeof renderHook<ReturnType<typeof useLayoutTab>, number>> {
  return renderHook((key: number) => useLayoutTab(key, BASE_ID), {
    initialProps: conversationKey,
  });
}

/**
 * Sets where the page is scrolled, as the browser would.
 * @param y - Vertical scroll position.
 */
function scrollPageTo(y: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
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
  document.body.replaceChildren();
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

  test("switches tab from content inside a column", () => {
    const { result } = renderLayoutTab();
    act(() => result.current.onSelectTab(LAYOUT_TAB.SETUP));
    expect(result.current.tab).toBe(LAYOUT_TAB.SETUP);
  });

  // Content inside a column gets it through context, so a new handler on each
  // switch would re-render that content for nothing.
  test("keeps the same handler for content inside a column between switches", () => {
    const { result } = renderLayoutTab();
    const { onSelectTab } = result.current;
    act(() => onSelectTab(LAYOUT_TAB.SETUP));
    act(() => result.current.onSelectTab(LAYOUT_TAB.HISTORY));
    expect(result.current.onSelectTab).toBe(onSelectTab);
  });

  test("keeps the scroll of the tab left when switching from inside a column", () => {
    const { result } = renderLayoutTab();
    act(() => result.current.onSelectTab(LAYOUT_TAB.HISTORY));
    scrollPageTo(320);
    act(() => result.current.onSelectTab(LAYOUT_TAB.SETUP));
    act(() => result.current.onSelectTab(LAYOUT_TAB.HISTORY));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 320 });
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

  // Opening a conversation from the history hides the control the user was
  // on, so focus follows them to the chat rather than being lost.
  test("moves focus to the chat tab when it was in the tab just left", () => {
    const chatTab = addButton(getTabId(BASE_ID, LAYOUT_TAB.CHAT));
    const { rerender, result } = renderLayoutTab(0);
    switchTo(result, LAYOUT_TAB.HISTORY);
    addButton("open-conversation", LAYOUT_TAB.HISTORY).focus();
    rerender(1);
    expect(document.activeElement).toBe(chatTab);
  });

  test("leaves focus on the tab just clicked", () => {
    addButton(getTabId(BASE_ID, LAYOUT_TAB.SETUP));
    const { result } = renderLayoutTab();
    const clickedTab = addButton("clicked-tab");
    clickedTab.focus();
    switchTo(result, LAYOUT_TAB.SETUP);
    expect(document.activeElement).toBe(clickedTab);
  });

  // Safari doesn't focus a button on click, leaving focus on the page.
  test("doesn't take focus when nothing in the tab just left had it", () => {
    addButton(getTabId(BASE_ID, LAYOUT_TAB.SETUP));
    const { result } = renderLayoutTab();
    switchTo(result, LAYOUT_TAB.SETUP);
    expect(document.activeElement).toBe(document.body);
  });

  // Safari doesn't focus a tapped history item, so nothing has focus when the
  // conversation changes; the chat tab takes it all the same.
  test("moves focus to the chat tab when the conversation changes from another tab", () => {
    const chatTab = addButton(getTabId(BASE_ID, LAYOUT_TAB.CHAT));
    const { rerender, result } = renderLayoutTab(0);
    switchTo(result, LAYOUT_TAB.HISTORY);
    rerender(1);
    expect(document.activeElement).toBe(chatTab);
  });

  test("leaves focus alone when the conversation changes on the chat", () => {
    addButton(getTabId(BASE_ID, LAYOUT_TAB.CHAT));
    const { rerender } = renderLayoutTab(0);
    rerender(1);
    expect(document.activeElement).toBe(document.body);
  });

  // The control used is in the column now hidden, and in Safari it never had
  // focus, so the new tab takes it.
  test("moves focus to the new tab when switching from inside a column", () => {
    const setupTab = addButton(getTabId(BASE_ID, LAYOUT_TAB.SETUP));
    const { result } = renderLayoutTab();
    act(() => result.current.onSelectTab(LAYOUT_TAB.SETUP));
    expect(document.activeElement).toBe(setupTab);
  });
});
