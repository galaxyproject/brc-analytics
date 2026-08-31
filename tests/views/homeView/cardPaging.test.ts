import {
  CARD_GAP,
  CARD_WIDTH,
  CONTENT_WIDTH,
} from "@brc/views/HomeView/components/SectionWhatsNew/components/Cards/constants";
import {
  getAreaWidth,
  getCardWidth,
  getMaxIndex,
  getMaxOffset,
  getOffset,
} from "@brc/views/HomeView/components/SectionWhatsNew/hooks/UseCardPaging/utils";

const CARD_COUNT = 5;
const STEP = CARD_WIDTH + CARD_GAP;
const ROW_WIDTH = CARD_COUNT * CARD_WIDTH + (CARD_COUNT - 1) * CARD_GAP;
// The cards bleed to the edge of the page, so the measured viewport is wider
// than the column they page within.
const WIDE_VIEWPORT = 1568;

describe("getAreaWidth", () => {
  test("pages within the content column, however far the cards bleed", () => {
    expect(getAreaWidth(WIDE_VIEWPORT)).toBe(CONTENT_WIDTH);
  });

  test("falls back to the space available on a narrow screen", () => {
    expect(getAreaWidth(374)).toBe(374);
  });
});

describe("getCardWidth", () => {
  test("keeps the design's width where it fits", () => {
    expect(getCardWidth(WIDE_VIEWPORT)).toBe(CARD_WIDTH);
  });

  test("shrinks to the screen where the design's width doesn't fit", () => {
    expect(getCardWidth(374)).toBe(374);
  });
});

describe("getMaxOffset", () => {
  test("ends with the last card inside the content column", () => {
    // Not flush with the edge of the page: the bleed is for the cards still to
    // come, and the final page brings the last one back into the column.
    expect(getMaxOffset(WIDE_VIEWPORT, CARD_COUNT)).toBe(
      ROW_WIDTH - CONTENT_WIDTH
    );
  });

  test("has nowhere to shift when the row fits the column", () => {
    expect(getMaxOffset(WIDE_VIEWPORT, 2)).toBe(0);
  });
});

describe("getMaxIndex", () => {
  test("counts the pages needed to reach the last card", () => {
    expect(getMaxIndex(WIDE_VIEWPORT, CARD_COUNT)).toBe(3);
  });

  test("has nothing to page when every card is already in the column", () => {
    expect(getMaxIndex(WIDE_VIEWPORT, 2)).toBe(0);
  });

  test("pages one card at a time when only one fits", () => {
    expect(getMaxIndex(374, CARD_COUNT)).toBe(CARD_COUNT - 1);
  });

  test("has nothing to page before the viewport is measured", () => {
    // The first render reports no width; offering paging then would jump the
    // row as soon as the real width arrives.
    expect(getMaxIndex(0, CARD_COUNT)).toBe(0);
  });
});

describe("getOffset", () => {
  test("shifts by a whole card and its gap", () => {
    expect(getOffset(1, WIDE_VIEWPORT, CARD_COUNT)).toBe(STEP);
  });

  test("starts flush with the content column", () => {
    expect(getOffset(0, WIDE_VIEWPORT, CARD_COUNT)).toBe(0);
  });

  test("stops at the last card rather than paging into empty space", () => {
    // Three whole pages would overshoot; the final page is a short one.
    expect(getOffset(3, WIDE_VIEWPORT, CARD_COUNT)).toBe(
      ROW_WIDTH - CONTENT_WIDTH
    );
    expect(getOffset(99, WIDE_VIEWPORT, CARD_COUNT)).toBe(
      ROW_WIDTH - CONTENT_WIDTH
    );
  });
});
