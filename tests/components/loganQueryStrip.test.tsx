import {
  describeSearchScope,
  LoganQueryStrip,
} from "@repo/shared/components/LoganSearch/LoganQueryStrip/loganQueryStrip";
import { type RecentSearch } from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import { type KmindexResults } from "@repo/shared/hooks/useKmindexSearch";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const REGISTERED = ["GENOMIC_BCT", "GENOMIC_INV", "GENOMIC_VRL", "RNA_INV"];

const ENTRY: RecentSearch = {
  indexes: ["GENOMIC_INV"],
  jobId: "caba199720b6634e",
  queryName: "PfEMP1_var",
  sequence: ">PfEMP1_var fragment\nATGGGTGCA\nCAAAGT\n",
  submittedAt: "2026-10-12T09:14:00.000Z",
  threshold: 0.8,
};

const RESULTS = {
  per_index: [
    { hits_after_cap: 3, hits_before_cap: 3, index: "GENOMIC_BCT" },
    { hits_after_cap: 0, hits_before_cap: 0, index: "GENOMIC_VRL" },
  ],
  query_name: "from_results",
} as unknown as KmindexResults;

/**
 * Render the strip.
 * @param props - Props to change.
 * @param props.entry - This browser's record, if any.
 * @param props.results - Landed results, if any.
 */
function renderStrip(props: {
  entry?: RecentSearch;
  results?: KmindexResults | null;
}): void {
  render(
    <LoganQueryStrip
      editHref={(jobId): string => `/?edit=${jobId}`}
      entry={props.entry}
      jobId="caba199720b6634e"
      newHref="/"
      registered={REGISTERED}
      results={props.results ?? null}
    />
  );
}

describe("LoganQueryStrip", () => {
  test("names this browser's own search and offers to edit it", () => {
    renderStrip({ entry: ENTRY });

    expect(screen.getByRole("heading", { name: "PfEMP1_var" })).toBeTruthy();
    expect(screen.getByText("ATGGGTGCACAAAGT")).toBeTruthy();
    expect(screen.getByText("15 bp")).toBeTruthy();
    expect(screen.getByText("threshold 0.80")).toBeTruthy();
    expect(screen.getByText("job caba199720b6634e")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Edit search" }).getAttribute("href")
    ).toBe("/?edit=caba199720b6634e");
    expect(
      screen.getByRole("link", { name: "New search" }).getAttribute("href")
    ).toBe("/");
  });

  test("falls back to the results for someone else's link, with no edit", () => {
    renderStrip({ results: RESULTS });

    expect(screen.getByRole("heading", { name: "from_results" })).toBeTruthy();
    expect(screen.getByText("2 indexes")).toBeTruthy();
    expect(screen.queryByText(/threshold/)).toBeNull();
    expect(screen.queryByText(/ bp$/)).toBeNull();
    expect(screen.queryByRole("link", { name: "Edit search" })).toBeNull();
    expect(screen.getByRole("link", { name: "New search" })).toBeTruthy();
  });

  test("names the job while a stranger's search is still running", () => {
    renderStrip({});

    expect(
      screen.getByRole("heading", { name: "Job caba199720b6634e" })
    ).toBeTruthy();
  });
});

describe("describeSearchScope", () => {
  test("names a preset the indexes match exactly", () => {
    const scope = describeSearchScope(REGISTERED, REGISTERED);
    expect(scope).toMatch(/ · 4 indexes$/);
    expect(scope).not.toBe("4 indexes");
  });

  test("counts a set no preset covers", () => {
    expect(describeSearchScope(REGISTERED, ["GENOMIC_BCT", "RNA_INV"])).toBe(
      "2 indexes"
    );
  });
});
