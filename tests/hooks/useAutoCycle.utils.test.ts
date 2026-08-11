import { getNextIndex } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/hooks/UseAutoCycle/utils";

describe("getNextIndex", () => {
  const KEYS = ["0", "1", "2"];

  it("returns the next key in order", () => {
    expect(getNextIndex(KEYS, "0")).toBe("1");
    expect(getNextIndex(KEYS, "1")).toBe("2");
  });

  it("wraps around from the last key to the first", () => {
    expect(getNextIndex(KEYS, "2")).toBe("0");
  });

  it("falls back to the first key when prevIndex is not found", () => {
    expect(getNextIndex(KEYS, "unknown")).toBe("0");
  });

  it("returns prevIndex when the key list is empty", () => {
    expect(getNextIndex([], "0")).toBe("0");
    expect(getNextIndex([], "")).toBe("");
  });
});
