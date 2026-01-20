import {
  getDisabledValues,
  getMaxPairCount,
  getUsedPairKeys,
  isAllPairsUsed,
  normalizePairKey,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/utils";
import { ContrastPairs } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";

describe("normalizePairKey", () => {
  test("returns same key for A,B and B,A", () => {
    expect(normalizePairKey("A", "B")).toBe(normalizePairKey("B", "A"));
  });

  test("sorts values alphabetically", () => {
    expect(normalizePairKey("B", "A")).toBe("A\0B");
    expect(normalizePairKey("A", "B")).toBe("A\0B");
  });

  test("handles numeric strings", () => {
    expect(normalizePairKey("1", "2")).toBe(`1\0${2}`);
    expect(normalizePairKey("2", "1")).toBe(`1\0${2}`);
  });
});

describe("getUsedPairKeys", () => {
  test("returns empty set for empty pairs", () => {
    const pairs: ContrastPairs = new Map();
    expect(getUsedPairKeys(pairs).size).toBe(0);
  });

  test("returns normalized keys for complete pairs", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["A", "B"]],
      ["1", ["C", "D"]],
    ]);

    const keys = getUsedPairKeys(pairs);

    expect(keys.has("A\0B")).toBe(true);
    expect(keys.has("C\0D")).toBe(true);
    expect(keys.size).toBe(2);
  });

  test("excludes incomplete pairs (empty values)", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["A", "B"]],
      ["1", ["C", ""]],
      ["2", ["", "D"]],
    ]);

    const keys = getUsedPairKeys(pairs);

    expect(keys.size).toBe(1);
    expect(keys.has("A\0B")).toBe(true);
  });

  test("excludes specified pair by ID", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["A", "B"]],
      ["1", ["C", "D"]],
    ]);

    const keys = getUsedPairKeys(pairs, "0");

    expect(keys.has("A\0B")).toBe(false);
    expect(keys.has("C\0D")).toBe(true);
    expect(keys.size).toBe(1);
  });
});

describe("getMaxPairCount", () => {
  test("returns 0 for 0 or 1 values", () => {
    expect(getMaxPairCount(0)).toBe(0);
    expect(getMaxPairCount(1)).toBe(0);
  });

  test("returns 1 for 2 values", () => {
    expect(getMaxPairCount(2)).toBe(1);
  });

  test("returns 3 for 3 values", () => {
    expect(getMaxPairCount(3)).toBe(3);
  });

  test("returns 6 for 4 values", () => {
    expect(getMaxPairCount(4)).toBe(6);
  });
});

describe("isAllPairsUsed", () => {
  test("returns false when no pairs are used", () => {
    const pairs: ContrastPairs = new Map([["0", ["", ""]]]);

    expect(isAllPairsUsed(["A", "B", "C"], pairs)).toBe(false);
  });

  test("returns false when some pairs remain", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["A", "B"]],
      ["1", ["A", "C"]],
    ]);

    // 3 values = 3 max pairs, only 2 used
    expect(isAllPairsUsed(["A", "B", "C"], pairs)).toBe(false);
  });

  test("returns true when all pairs are used", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["A", "B"]],
      ["1", ["A", "C"]],
      ["2", ["B", "C"]],
    ]);

    expect(isAllPairsUsed(["A", "B", "C"], pairs)).toBe(true);
  });
});

describe("getDisabledValues", () => {
  const factorValues = ["1", "2", "3"];

  describe("when otherValue is empty", () => {
    test("returns empty set when no pairs exist", () => {
      const pairs: ContrastPairs = new Map([["0", ["", ""]]]);

      const disabled = getDisabledValues(factorValues, pairs, "0", "");

      expect(disabled.size).toBe(0);
    });

    test("disables values with no valid partners remaining", () => {
      // Pairs 1-2 and 1-3 exist, so "1" has no valid partners left
      const pairs: ContrastPairs = new Map([
        ["0", ["1", "2"]],
        ["1", ["1", "3"]],
        ["2", ["", ""]],
      ]);

      const disabled = getDisabledValues(factorValues, pairs, "2", "");

      // "1" should be disabled because 1-2 and 1-3 are used
      expect(disabled.has("1")).toBe(true);
      // "2" should be enabled because 2-3 is still available
      expect(disabled.has("2")).toBe(false);
      // "3" should be enabled because 2-3 is still available
      expect(disabled.has("3")).toBe(false);
    });
  });

  describe("when otherValue is set", () => {
    test("disables the other value (prevents self-pair)", () => {
      const pairs: ContrastPairs = new Map([["0", ["", "2"]]]);

      const disabled = getDisabledValues(factorValues, pairs, "0", "2");

      expect(disabled.has("2")).toBe(true);
    });

    test("disables values that would create duplicate pairs", () => {
      // Pair 1-3 exists
      const pairs: ContrastPairs = new Map([
        ["0", ["1", "3"]],
        ["1", ["", "3"]], // editing this pair, second value is 3
      ]);

      const disabled = getDisabledValues(factorValues, pairs, "1", "3");

      // "3" disabled (self-pair)
      expect(disabled.has("3")).toBe(true);
      // "1" disabled (1-3 already exists)
      expect(disabled.has("1")).toBe(true);
      // "2" enabled (2-3 doesn't exist)
      expect(disabled.has("2")).toBe(false);
    });

    test("does not disable values from the current pair being edited", () => {
      // Editing pair 0 which has 1-2
      const pairs: ContrastPairs = new Map([["0", ["1", "2"]]]);

      // If we're editing pair 0 and second value is "2", first select should allow "1"
      const disabled = getDisabledValues(factorValues, pairs, "0", "2");

      // "2" disabled (self-pair)
      expect(disabled.has("2")).toBe(true);
      // "1" should NOT be disabled (it's the current pair being edited)
      expect(disabled.has("1")).toBe(false);
      // "3" enabled
      expect(disabled.has("3")).toBe(false);
    });
  });

  describe("direction-agnostic duplicates", () => {
    test("disables value when reverse pair exists", () => {
      // Pair 2-1 exists (same as 1-2)
      const pairs: ContrastPairs = new Map([
        ["0", ["2", "1"]],
        ["1", ["", "2"]], // editing, second value is 2
      ]);

      const disabled = getDisabledValues(factorValues, pairs, "1", "2");

      // "1" should be disabled because 2-1 (= 1-2) exists
      expect(disabled.has("1")).toBe(true);
    });
  });
});
