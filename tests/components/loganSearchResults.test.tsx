import { LoganSearchResults } from "@brc/components/LoganSearch/LoganSearchResults/loganSearchResults";
import {
  type KmindexIndexSummary,
  type KmindexResults,
  PAGE_SIZE,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { render, screen } from "@testing-library/react";

// The component reaches into the hook module for PAGE_SIZE, and that module
// imports ky, which ships ESM only and Jest cannot parse.
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
 * and goToPage, so the rest of the search state is stubbed.
 * @param results - Payload as the API sends it. Typed loosely because the
 * old-backend case is precisely a payload missing keys the type declares.
 * @returns The render result.
 */
function renderResults(results: unknown): ReturnType<typeof render> {
  const search = {
    error: null,
    goToPage: jest.fn(),
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: BASE_RESULTS.job_id,
    jobStatus: null,
    reset: jest.fn(),
    results,
    submit: jest.fn(),
  } as unknown as Search;
  return render(<LoganSearchResults search={search} />);
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
