import { LAYOUT_TAB } from "@repo/shared/views/AssistantView/components/Layout/constants";
import type { LayoutSlotProps } from "@repo/shared/views/AssistantView/components/Layout/types";
import {
  buildTabs,
  getTabId,
  getTabPanelId,
  getTabPanelProps,
} from "@repo/shared/views/AssistantView/components/Layout/utils";

const BASE_ID = "layout";

const SLOT_PROPS: LayoutSlotProps = {
  chat: { children: null, tabLabel: "Chat" },
  history: { children: null, tabLabel: "History" },
  setup: { children: null, tabLabel: "Setup 2/7" },
};

describe("buildTabs", () => {
  test("lists history, chat and setup, in that order, with their labels", () => {
    expect(buildTabs(SLOT_PROPS)).toEqual([
      { label: "History", value: LAYOUT_TAB.HISTORY },
      { label: "Chat", value: LAYOUT_TAB.CHAT },
      { label: "Setup 2/7", value: LAYOUT_TAB.SETUP },
    ]);
  });
});

describe("getTabId and getTabPanelId", () => {
  test("give each tab and its panel a distinct id", () => {
    const ids = Object.values(LAYOUT_TAB).flatMap((tab) => [
      getTabId(BASE_ID, tab),
      getTabPanelId(BASE_ID, tab),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("scope ids to the layout", () => {
    expect(getTabId("a", LAYOUT_TAB.CHAT)).not.toBe(
      getTabId("b", LAYOUT_TAB.CHAT)
    );
    expect(getTabPanelId("a", LAYOUT_TAB.CHAT)).not.toBe(
      getTabPanelId("b", LAYOUT_TAB.CHAT)
    );
  });
});

describe("getTabPanelProps", () => {
  test("makes a column the panel its tab controls while tabbed", () => {
    expect(getTabPanelProps(BASE_ID, LAYOUT_TAB.SETUP, true)).toEqual({
      "aria-labelledby": getTabId(BASE_ID, LAYOUT_TAB.SETUP),
      id: getTabPanelId(BASE_ID, LAYOUT_TAB.SETUP),
      role: "tabpanel",
    });
  });

  test("leaves a column a plain column side by side, keeping its id", () => {
    expect(getTabPanelProps(BASE_ID, LAYOUT_TAB.SETUP, false)).toEqual({
      id: getTabPanelId(BASE_ID, LAYOUT_TAB.SETUP),
    });
  });
});
