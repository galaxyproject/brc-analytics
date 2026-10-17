import { LoganSearchHistory } from "@brc/components/LoganSearch/LoganSearchHistory/loganSearchHistory";
import {
  addRecentSearch,
  clearRecentSearches,
  MAX_RECENT_SEARCHES,
  queryNameOf,
  readRecentSearches,
  RECENT_SEARCHES_KEY,
  type RecentSearch,
} from "@brc/components/LoganSearch/LoganSearchHistory/recentSearches";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * A stored search.
 * @param jobId - Its job id.
 * @param overrides - Fields to change.
 * @returns The entry.
 */
function entry(
  jobId: string,
  overrides: Partial<RecentSearch> = {}
): RecentSearch {
  return {
    indexes: ["GENOMIC_INV"],
    jobId,
    queryName: "Plasmodium_falciparum_18S",
    submittedAt: "2026-10-05T12:00:00.000Z",
    threshold: 0.5,
    ...overrides,
  };
}

describe("queryNameOf", () => {
  test("takes the first word of the FASTA header", () => {
    expect(queryNameOf(">M19172.1 Plasmodium falciparum\nACGT")).toBe(
      "M19172.1"
    );
  });

  test("skips leading blank lines", () => {
    expect(queryNameOf("\n\n  >q1\nACGT")).toBe("q1");
  });

  test("is null for a bare sequence or an empty header", () => {
    expect(queryNameOf("ACGTACGT")).toBeNull();
    expect(queryNameOf(">\nACGT")).toBeNull();
  });
});

describe("recent searches storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  test("puts the newest first, drops a repeated job and caps the list", () => {
    let list: RecentSearch[] = [];
    for (let i = 0; i < MAX_RECENT_SEARCHES + 5; i++) {
      list = addRecentSearch(list, entry(`job${i}`));
    }
    list = addRecentSearch(list, entry("job10"));

    expect(list).toHaveLength(MAX_RECENT_SEARCHES);
    expect(list[0].jobId).toBe("job10");
    expect(list.filter((e) => e.jobId === "job10")).toHaveLength(1);
    expect(readRecentSearches()).toEqual(list);
  });

  test("ignores malformed storage rather than throwing", () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, "{not json");
    expect(readRecentSearches()).toEqual([]);

    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify([entry("good"), { jobId: 7 }, null, "nope"])
    );
    expect(readRecentSearches().map((e) => e.jobId)).toEqual(["good"]);
  });

  test("keeps working when storage throws on every access", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((): never => {
      throw new Error("SecurityError");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation((): never => {
      throw new Error("QuotaExceededError");
    });
    jest
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation((): never => {
        throw new Error("SecurityError");
      });

    expect(readRecentSearches()).toEqual([]);
    expect(addRecentSearch([], entry("a")).map((e) => e.jobId)).toEqual(["a"]);
    expect(() => clearRecentSearches()).not.toThrow();
  });

  test("clear forgets everything", () => {
    addRecentSearch([], entry("a"));
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
  });
});

describe("LoganSearchHistory", () => {
  test("renders nothing with no searches", () => {
    const { container } = render(
      <LoganSearchHistory
        currentJobId={null}
        onClear={jest.fn()}
        searches={[]}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("links each search back to its job and marks the one on screen", () => {
    render(
      <LoganSearchHistory
        currentJobId="current"
        onClear={jest.fn()}
        searches={[
          entry("current"),
          entry("older", {
            indexes: ["A", "B", "C", "D", "E"],
            queryName: null,
            threshold: 0.75,
          }),
        ]}
      />
    );

    const link = screen.getByRole("link", { name: "Job older" });
    expect(link.getAttribute("href")).toBe("/logan-search?job=older");
    expect(
      screen.getByText("Plasmodium_falciparum_18S (on screen)")
    ).toBeTruthy();
    expect(screen.getByText(/A, B, C and 2 more/)).toBeTruthy();
    expect(screen.getByText(/threshold 0\.75/)).toBeTruthy();
  });

  test("clear calls back", () => {
    const onClear = jest.fn();
    render(
      <LoganSearchHistory
        currentJobId={null}
        onClear={onClear}
        searches={[entry("a")]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
