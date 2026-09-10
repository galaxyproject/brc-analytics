import { CARDS } from "@brc/views/LearnView/constants";
import { getFilteredCards } from "@brc/views/LearnView/utils";

const GATED_CARDS = CARDS.filter(({ isDemoGated }) => isDemoGated);

describe("getFilteredCards", () => {
  test("omits the demo-gated cards when the demo flag is disabled", () => {
    // The gated cards are named on the cards themselves, so the assertion
    // reads them from the source rather than restating which ones they are.
    expect(GATED_CARDS.length).toBeGreaterThan(0);
    expect(getFilteredCards(false)).toEqual(
      CARDS.filter(({ isDemoGated }) => !isDemoGated)
    );
  });

  test("returns every card when the demo flag is enabled", () => {
    expect(getFilteredCards(true)).toEqual(CARDS);
  });
});
