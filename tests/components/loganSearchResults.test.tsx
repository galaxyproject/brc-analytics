import {
  LoganSearchResults,
  MIRROR_SCOPE_NOTE,
} from "@brc/components/LoganSearch/LoganSearchResults/loganSearchResults";
import {
  type KmindexIndexSummary,
  type KmindexResults,
  PAGE_SIZE,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { fireEvent, render, screen, within } from "@testing-library/react";

// The component reaches into the hook module for the page sizes and the sort
// helpers, and that module imports ky, which ships ESM only and Jest cannot
// parse.
jest.mock("ky", () => ({ __esModule: true, default: {} }));

type Search = ReturnType<typeof useKmindexSearch>;

// Counts are from real kmindex jobs so the copy is exercised at the
// magnitudes it exists for: a bacterial 16S fragment at threshold 0.5 across
// GENOMIC_BCT + METATRANSCRIPTOMIC_BCT, against the backend's 50,000 cap.
const CAP = 50000;

// Asserted from both branches: how wide the tie band is depends on the query,
// not on how many indexes were searched.
const TIE_BAND_COPY =
  "Scores repeat: the score is a fraction of your query's k-mers, so ties " +
  "are common and a conserved query can put every row listed here on a " +
  "single one. Where the cut falls inside a tie, a stable hash of the " +
  "accession decides which equally-scoring runs made the list -- arbitrary, " +
  "but the same on every reload.";

const BASE_RESULTS: KmindexResults = {
  hits: [
    {
      accession: "SRR000001",
      ani: 1,
      fp_correction: null,
      score: 1,
      shard: "GENOMIC_BCT_10_null",
      sra: null,
    },
  ],
  job_id: "dee9dc267ca2a401",
  limit: PAGE_SIZE,
  offset: 0,
  per_index: [],
  query_name: "16S",
  shards_failed: 0,
  shards_searched: 84,
  shards_with_hits: 84,
  sra_annotated: 0,
  sra_mirror_available: false,
  total_hits: 1,
  total_matches: 1,
  truncated: false,
};

/**
 * Per-index summary shorthand.
 * @param index - Index name.
 * @param before - Hits the index matched, before the global cap.
 * @param after - Hits of the index's that survived the cap.
 * @returns A per-index summary row as the API sends it.
 */
function summary(
  index: string,
  before: number,
  after: number
): KmindexIndexSummary {
  return { hits_after_cap: after, hits_before_cap: before, index };
}

/**
 * Payload for a truncated search, with the totals derived from the breakdown
 * so the numbers on screen stay mutually consistent.
 * @param perIndex - Per-index rows the backend reported.
 * @returns A results payload whose cap arithmetic adds up.
 */
function truncatedResults(perIndex: KmindexIndexSummary[]): KmindexResults {
  return {
    ...BASE_RESULTS,
    per_index: perIndex,
    total_hits: perIndex.reduce((sum, s) => sum + s.hits_after_cap, 0),
    total_matches: perIndex.reduce((sum, s) => sum + s.hits_before_cap, 0),
    truncated: true,
  };
}

/**
 * Render the results card around a payload; the component reads only results
 * and the paging and sorting actions, so the rest of the search state is
 * stubbed.
 * @param results - Payload as the API sends it. Typed loosely because the
 * old-backend case is precisely a payload missing keys the type declares.
 * @param actions - Overrides for the stubbed actions.
 * @returns The render result, plus the action stubs the card was handed.
 */
function renderResults(
  results: unknown,
  actions: Partial<Pick<Search, "goToPage" | "setPageSize" | "setSort">> = {}
): ReturnType<typeof render> & {
  actions: Pick<Search, "goToPage" | "setPageSize" | "setSort">;
} {
  const resolved = {
    goToPage: jest.fn(),
    setPageSize: jest.fn(),
    setSort: jest.fn(),
    ...actions,
  };
  const search = {
    error: null,
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: BASE_RESULTS.job_id,
    jobStatus: null,
    pageSize: PAGE_SIZE,
    reset: jest.fn(),
    results,
    sort: { column: "score", order: "desc" },
    submit: jest.fn(),
    ...resolved,
  } as unknown as Search;
  return {
    ...render(<LoganSearchResults search={search} />),
    actions: resolved,
  };
}

describe("LoganSearchResults truncation disclosure", () => {
  test("reports the true match count and what cannot be paged to", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    expect(screen.getByText("1,133,516 SRA accessions matched")).toBeTruthy();
    expect(container.textContent).toContain(
      "Listing the 50,000 highest-scoring -- the remaining 1,083,516 cannot be paged to."
    );
  });

  test("says the threshold does not re-rank the listing", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    expect(container.textContent).toContain(
      "Raising the threshold shrinks the underlying match count, but it does not re-rank what you see: the same accessions come back in the same order until the threshold rises above the lowest score listed here."
    );
    // The shipped copy claimed the opposite; at 0.5 through 1.0 the real job
    // returned the same 50,000 accessions in the same order.
    expect(container.textContent).not.toContain("re-ranks these matches");
  });

  test("separates an index that would come back whole from one that would still cap", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    expect(container.textContent).toContain(
      "GENOMIC_BCT: 47,089 of 1,100,404 listed -- alone it would still cap at 50,000"
    );
    expect(container.textContent).toContain(
      "METATRANSCRIPTOMIC_BCT: 2,911 of 33,112 listed -- alone it would return all 33,112"
    );
  });

  test("separates an index that matched nothing from one that kept nothing", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
        summary("METAGENOMIC_UNKNOWN", 39, 0),
        summary("METAGENOMIC_PHG", 0, 0),
      ])
    );

    expect(container.textContent).toContain(
      "METAGENOMIC_UNKNOWN: 39 matched, none listed -- alone it would return all 39"
    );
    expect(container.textContent).toContain("METAGENOMIC_PHG: no matches");
  });

  test("still carries an explanation when only one index was searched", () => {
    const { container } = renderResults(
      truncatedResults([summary("GENOMIC_VRL", 157741, CAP)])
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(container.textContent).toContain(TIE_BAND_COPY);
    // A single index cannot be swamped by another, so no breakdown and no
    // advice to search it on its own.
    expect(container.textContent).not.toContain("alone it would");
    expect(container.textContent).not.toContain("GENOMIC_VRL:");
  });

  test("warns about ties when more than one index was searched too", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    // This is the job where the caveat is most true and used to be hidden:
    // all 50,000 listed rows score exactly 1.0. Eight indexes over the same
    // query give one distinct score as well, while a single index over a
    // viral spike gives 87 -- so index count cannot gate this sentence.
    expect(container.textContent).toContain(TIE_BAND_COPY);
    expect(container.textContent).toContain("GENOMIC_BCT: 47,089 of 1,100,404");
  });

  test("does not tell the reader that a longer query shrinks the match set", () => {
    const { container } = renderResults(
      truncatedResults([summary("GENOMIC_VRL", 157741, CAP)])
    );

    // Measured the other way: the 2,090 bp 18S superset of a 500 bp window
    // matched 18,019 runs against the window's 17,633, same two indexes and
    // same threshold. Length is not a lever, so the copy cannot offer it.
    expect(container.textContent).toContain(
      "A longer query is not a more specific one"
    );
    expect(container.textContent).toContain(
      "The match set responds to how rare your k-mers are and to the threshold above, not to query length."
    );
    expect(container.textContent).not.toContain(
      "longer, or from a less conserved region"
    );
  });

  test("stays quiet when nothing was truncated", () => {
    const { container } = renderResults({
      ...BASE_RESULTS,
      per_index: [
        summary("GENOMIC_EUK", 17000, 17000),
        summary("METAGENOMIC_ENV", 633, 633),
      ],
      total_hits: 17633,
      total_matches: 17633,
    });

    expect(screen.getByText("17,633 SRA accessions")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.textContent).toContain(
      "GENOMIC_EUK 17,000 · METAGENOMIC_ENV 633"
    );
    expect(container.textContent).not.toContain("cannot be paged to");
  });

  test("renders a truncated result from a backend that sends neither total_matches nor per_index", () => {
    const legacy: Record<string, unknown> = {
      ...BASE_RESULTS,
      total_hits: CAP,
      truncated: true,
    };
    delete legacy.per_index;
    delete legacy.total_matches;

    const { container } = renderResults(legacy);

    expect(screen.getByText("50,000 SRA accessions listed")).toBeTruthy();
    expect(container.textContent).toContain(
      "Capped at 50,000 -- more accessions matched than can be listed."
    );
    // Degraded, not broken: the card renders, and no arithmetic on the
    // missing count leaks to the page.
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toContain("remaining 0");
  });

  test("renders an untruncated result from that same backend", () => {
    const legacy: Record<string, unknown> = { ...BASE_RESULTS, total_hits: 17 };
    delete legacy.per_index;
    delete legacy.total_matches;

    const { container } = renderResults(legacy);

    expect(screen.getByText("17 SRA accessions")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.textContent).not.toContain("NaN");
  });
});

describe("SRA mirror chip", () => {
  test("describes the mirror as all of SRA, not a BRC-filtered subset", () => {
    renderResults({
      ...BASE_RESULTS,
      sra_annotated: 1,
      sra_mirror_available: true,
    });

    const chip = screen.getByText("SRA mirror: 1/1 on this page");
    const title = chip.closest("[title]")?.getAttribute("title") ?? "";
    expect(title).toBe(MIRROR_SCOPE_NOTE);
    // The deployed mirror is every run in SRA when it was built (v6:
    // 44,057,338 runs). The old copy told users to expect misses that
    // should never happen, and made a real annotation failure read as normal.
    expect(title).not.toMatch(/BRC-relevant/i);
    expect(title).toMatch(/every run|all of SRA/i);
    expect(title).toMatch(/newer than the mirror/i);
  });
});

describe("coverage and ANI columns", () => {
  test("labels the score as k-mer coverage and shows the ANI estimate", () => {
    renderResults({
      ...BASE_RESULTS,
      hits: [
        {
          accession: "SRR000001",
          ani: 0.9779,
          fp_correction: null,
          score: 0.5,
          shard: "GENOMIC_BCT_10_null",
          sra: null,
        },
      ],
    });

    expect(screen.getByText("k-mer coverage")).toBeTruthy();
    expect(screen.getByText("ANI est.")).toBeTruthy();
    expect(screen.getByText("0.5000")).toBeTruthy();
    expect(screen.getByText("0.9779")).toBeTruthy();
    expect(screen.queryByText("corrected")).toBeNull();
  });

  test("marks a corrected hit and names the raw ratio", () => {
    renderResults({
      ...BASE_RESULTS,
      hits: [
        {
          accession: "SRR10916223",
          ani: 0.9619,
          fp_correction: 0.691,
          score: 0.299,
          shard: "METAGENOMIC_ENV_3_null",
          sra: null,
        },
      ],
    });

    const marker = screen.getByText("corrected");
    // MUI Tooltip puts the text on aria-label until hovered.
    const label = marker.closest("[aria-label]")?.getAttribute("aria-label");
    expect(label).toContain("kmindex reported 0.9900");
    expect(label).toContain("0.6910");
  });

  test("renders a dash for ANI when the API has none", () => {
    renderResults({
      ...BASE_RESULTS,
      hits: [
        {
          accession: "SRR000002",
          ani: null,
          fp_correction: 0.69,
          score: -0.05,
          shard: "GENOMIC_BCT_10_null",
          sra: null,
        },
      ],
    });

    // Scoped to the hit's own row: Platform, Country and Released all render
    // "--" for null metadata, so a page-wide dash search cannot fail.
    const row = screen.getByText("SRR000002").closest("tr");
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole("cell");

    // Accession, k-mer coverage, ANI est.
    expect(cells[2].textContent).toBe("--");
    // The coverage cell also carries the "corrected" chip, since this hit has
    // an fp_correction.
    expect(cells[1].textContent).toMatch(/^-0\.0500/);
  });
});

describe("sorting and page size", () => {
  test("clicking a header asks the hook to sort by that column", () => {
    const { actions } = renderResults(BASE_RESULTS);

    fireEvent.click(screen.getByText("Organism"));
    expect(actions.setSort).toHaveBeenCalledWith("organism");

    fireEvent.click(screen.getByText("k-mer coverage"));
    expect(actions.setSort).toHaveBeenCalledWith("score");

    fireEvent.click(screen.getByText("Released"));
    expect(actions.setSort).toHaveBeenCalledWith("release_date");
  });

  test("the active header follows what the API applied, not what was clicked", () => {
    // Asked for organism, got score back because the mirror was down.
    renderResults({ ...BASE_RESULTS, order: "desc", sort: "score" });

    const scoreHeader = screen.getByText("k-mer coverage").closest("th");
    const organismHeader = screen.getByText("Organism").closest("th");
    expect(scoreHeader?.getAttribute("aria-sort")).toBe("descending");
    expect(organismHeader?.getAttribute("aria-sort")).toBeNull();
  });

  test("offers 25, 50 and 100 rows per page and reports a change", () => {
    const { actions } = renderResults({ ...BASE_RESULTS, limit: 50 });

    const select = screen.getByRole("combobox", { name: /rows per page/i });
    expect(select.textContent).toBe("50");
    fireEvent.mouseDown(select);
    expect(screen.getByRole("option", { name: "25" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "100" })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "100" }));
    expect(actions.setPageSize).toHaveBeenCalledWith(100);
  });

  test("the page number is computed from the page size the API served", () => {
    renderResults({ ...BASE_RESULTS, limit: 50, offset: 100, total_hits: 400 });

    // Offset 100 at 50 a page is the third page. MUI joins the range with an
    // en dash, which the regex sidesteps.
    expect(screen.getByText(/101.150 of 400/)).toBeTruthy();
  });
});
