import { CARDS } from "@brc/views/LearnView/constants";
import { getFilteredCards } from "@brc/views/LearnView/utils";

const GATED_CARDS = CARDS.filter(({ isDemoGated }) => isDemoGated);
const LOGAN_CARDS = CARDS.filter(
  ({ isLoganSearchGated }) => isLoganSearchGated
);

describe("getFilteredCards", () => {
  test("omits the demo-gated cards when the demo flag is disabled", () => {
    // The gated cards are named on the cards themselves, so the assertion
    // reads them from the source rather than restating which ones they are.
    expect(GATED_CARDS.length).toBeGreaterThan(0);
    expect(getFilteredCards(false, true)).toEqual(
      CARDS.filter(({ isDemoGated }) => !isDemoGated)
    );
  });

  test("omits the Logan Search card unless Logan Search is enabled", () => {
    expect(LOGAN_CARDS.map(({ href }) => href)).toEqual([
      "/learn/logan-search",
    ]);
    expect(getFilteredCards(true)).toEqual(
      CARDS.filter(({ isLoganSearchGated }) => !isLoganSearchGated)
    );
  });

  test("returns every card when both flags are enabled", () => {
    expect(getFilteredCards(true, true)).toEqual(CARDS);
  });
});
