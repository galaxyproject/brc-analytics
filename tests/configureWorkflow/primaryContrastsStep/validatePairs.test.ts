import {
  addPairUpdater,
  createInitialPairs,
  getNextId,
  getValidPairs,
  removePairUpdater,
  updatePairUpdater,
  validatePairs,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/utils";
import {
  ContrastPair,
  ContrastPairs,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";

describe("validatePairs", () => {
  test("returns true when at least one complete pair exists", () => {
    const pairs: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    const result = validatePairs(pairs);

    expect(result).toBe(true);
  });

  test("returns true with multiple valid pairs", () => {
    const pairs: ContrastPairs = new Map([
      ["1", ["control", "treated"]],
      ["2", ["baseline", "experiment"]],
    ]);

    const result = validatePairs(pairs);

    expect(result).toBe(true);
  });

  test("returns true when at least one pair is valid among invalid ones", () => {
    const pairs: ContrastPairs = new Map([
      ["1", ["", ""]],
      ["2", ["control", "treated"]],
      ["3", ["incomplete", ""]],
    ]);

    const result = validatePairs(pairs);

    expect(result).toBe(true);
  });

  test("returns false when all pairs are empty", () => {
    const pairs: ContrastPairs = new Map([["1", ["", ""]]]);

    const result = validatePairs(pairs);

    expect(result).toBe(false);
  });

  test("returns false when pairs have same value on both sides", () => {
    const pairs: ContrastPairs = new Map([["1", ["control", "control"]]]);

    const result = validatePairs(pairs);

    expect(result).toBe(false);
  });

  test("returns false when first value is empty", () => {
    const pairs: ContrastPairs = new Map([["1", ["", "treated"]]]);

    const result = validatePairs(pairs);

    expect(result).toBe(false);
  });

  test("returns false when second value is empty", () => {
    const pairs: ContrastPairs = new Map([["1", ["control", ""]]]);

    const result = validatePairs(pairs);

    expect(result).toBe(false);
  });

  test("returns false for empty pairs map", () => {
    const pairs: ContrastPairs = new Map();

    const result = validatePairs(pairs);

    expect(result).toBe(false);
  });
});

describe("getValidPairs", () => {
  test("returns only complete and valid pairs", () => {
    const pairs: ContrastPairs = new Map([
      ["1", ["", ""]],
      ["2", ["control", "treated"]],
      ["3", ["incomplete", ""]],
      ["4", ["baseline", "experiment"]],
    ]);

    const result = getValidPairs(pairs);

    expect(result).toEqual([
      ["control", "treated"],
      ["baseline", "experiment"],
    ]);
  });

  test("excludes pairs with same value on both sides", () => {
    const pairs: ContrastPairs = new Map([
      ["1", ["control", "treated"]],
      ["2", ["same", "same"]],
    ]);

    const result = getValidPairs(pairs);

    expect(result).toEqual([["control", "treated"]]);
  });

  test("returns empty array when no valid pairs exist", () => {
    const pairs: ContrastPairs = new Map([
      ["1", ["", ""]],
      ["2", ["same", "same"]],
      ["3", ["incomplete", ""]],
    ]);

    const result = getValidPairs(pairs);

    expect(result).toEqual([]);
  });

  test("returns empty array for empty input", () => {
    const result = getValidPairs(new Map());

    expect(result).toEqual([]);
  });
});

describe("addPairUpdater", () => {
  test("adds an empty pair to an empty map", () => {
    const prev: ContrastPairs = new Map();

    const result = addPairUpdater("1")(prev);

    expect(result.get("1")).toEqual(["", ""]);
    expect(result.size).toBe(1);
  });

  test("adds an empty pair to existing pairs", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    const result = addPairUpdater("2")(prev);

    expect(result.get("1")).toEqual(["control", "treated"]);
    expect(result.get("2")).toEqual(["", ""]);
    expect(result.size).toBe(2);
  });

  test("does not mutate the original map", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    addPairUpdater("2")(prev);

    expect(prev.size).toBe(1);
    expect(prev.has("2")).toBe(false);
  });
});

describe("createInitialPairs", () => {
  test("returns a Map with one empty pair", () => {
    const result = createInitialPairs();

    expect(result.size).toBe(1);
    expect(result.get("0")).toEqual(["", ""]);
  });

  test("returns a new Map instance each time", () => {
    const first = createInitialPairs();
    const second = createInitialPairs();

    expect(first).not.toBe(second);
  });
});

describe("getNextId", () => {
  test("returns '0' for empty map", () => {
    const pairs: ContrastPairs = new Map();

    const result = getNextId(pairs);

    expect(result).toBe("0");
  });

  test("returns '1' when map has key '0'", () => {
    const pairs: ContrastPairs = new Map([["0", ["", ""]]]);

    const result = getNextId(pairs);

    expect(result).toBe("1");
  });

  test("returns max key plus one", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["a", "b"]],
      ["1", ["c", "d"]],
      ["2", ["e", "f"]],
    ]);

    const result = getNextId(pairs);

    expect(result).toBe("3");
  });

  test("handles non-sequential keys after deletion", () => {
    const pairs: ContrastPairs = new Map([
      ["0", ["a", "b"]],
      ["2", ["e", "f"]],
    ]);

    const result = getNextId(pairs);

    expect(result).toBe("3");
  });

  test("handles single high key", () => {
    const pairs: ContrastPairs = new Map([["5", ["a", "b"]]]);

    const result = getNextId(pairs);

    expect(result).toBe("6");
  });
});

describe("removePairUpdater", () => {
  test("removes pair by id", () => {
    const prev: ContrastPairs = new Map([
      ["1", ["control", "treated"]],
      ["2", ["baseline", "experiment"]],
    ]);

    const result = removePairUpdater("1")(prev);

    expect(result.has("1")).toBe(false);
    expect(result.get("2")).toEqual(["baseline", "experiment"]);
    expect(result.size).toBe(1);
  });

  test("removes pair from the middle", () => {
    const prev: ContrastPairs = new Map([
      ["1", ["a", "b"]],
      ["2", ["c", "d"]],
      ["3", ["e", "f"]],
    ]);

    const result = removePairUpdater("2")(prev);

    expect(result.has("2")).toBe(false);
    expect(result.get("1")).toEqual(["a", "b"]);
    expect(result.get("3")).toEqual(["e", "f"]);
    expect(result.size).toBe(2);
  });

  test("resets to initial state when removing the only pair", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    const result = removePairUpdater("1")(prev);

    expect(result.size).toBe(1);
    expect([...result.values()]).toEqual([["", ""]]);
  });

  test("does not mutate the original map", () => {
    const prev: ContrastPairs = new Map([
      ["1", ["control", "treated"]],
      ["2", ["baseline", "experiment"]],
    ]);

    removePairUpdater("1")(prev);

    expect(prev.size).toBe(2);
    expect(prev.has("1")).toBe(true);
  });
});

describe("updatePairUpdater", () => {
  test("updates the first position of a pair", () => {
    const prev: ContrastPairs = new Map([["1", ["", ""]]]);

    const result = updatePairUpdater("1", 0, "control")(prev);

    expect(result.get("1")).toEqual(["control", ""]);
  });

  test("updates the second position of a pair", () => {
    const prev: ContrastPairs = new Map([["1", ["control", ""]]]);

    const result = updatePairUpdater("1", 1, "treated")(prev);

    expect(result.get("1")).toEqual(["control", "treated"]);
  });

  test("updates a pair by id", () => {
    const prev: ContrastPairs = new Map([
      ["1", ["a", "b"]],
      ["2", ["", ""]],
      ["3", ["e", "f"]],
    ]);

    const result = updatePairUpdater("2", 0, "c")(prev);

    expect(result.get("2")).toEqual(["c", ""]);
    expect(result.get("1")).toEqual(["a", "b"]);
    expect(result.get("3")).toEqual(["e", "f"]);
  });

  test("replaces an existing value", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    const result = updatePairUpdater("1", 0, "baseline")(prev);

    expect(result.get("1")).toEqual(["baseline", "treated"]);
  });

  test("returns same map if id does not exist", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    const result = updatePairUpdater("nonexistent", 0, "baseline")(prev);

    expect(result).toBe(prev);
  });

  test("does not mutate the original map", () => {
    const prev: ContrastPairs = new Map([["1", ["control", "treated"]]]);

    updatePairUpdater("1", 0, "baseline")(prev);

    expect(prev.get("1")).toEqual(["control", "treated"]);
  });

  test("does not mutate the original pair tuple", () => {
    const originalPair: ContrastPair = ["control", "treated"];
    const prev: ContrastPairs = new Map([["1", originalPair]]);

    updatePairUpdater("1", 0, "baseline")(prev);

    expect(originalPair).toEqual(["control", "treated"]);
  });
});
