import {
  LoganSearchResults,
  MIRROR_SCOPE_NOTE,
} from "@brc/components/LoganSearch/LoganSearchResults/loganSearchResults";
import {
  type KmindexHit,
  type KmindexIndexSummary,
  type KmindexResults,
  PAGE_SIZE,
  type SraRunMetadata,
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

/**
 * A hit as the API sends one, defaulting to an unannotated perfect match.
 * @param overrides - The fields a case cares about.
 * @returns One hit.
 */
function hit(overrides: Partial<KmindexHit> = {}): KmindexHit {
  return {
    accession: "SRR000001",
    ani: 1,
    fp_correction: null,
    score: 1,
    shard: "GENOMIC_BCT_10_null",
    sra: null,
    ...overrides,
  };
}

/**
 * Mirror metadata for a run, with the three columns the table shows filled
 * in and the rest of the record left empty.
 * @param overrides - The fields a case cares about.
 * @returns The metadata as the mirror records it.
 */
function sraMeta(overrides: Partial<SraRunMetadata> = {}): SraRunMetadata {
  return {
    assay_type: null,
    bioproject: null,
    country: "Malawi",
    instrument: null,
    library_layout: null,
    mbases: null,
    organism: "Plasmodium falciparum",
    platform: "ILLUMINA",
    release_date: "2018-07-25T00:00:00Z",
    study: null,
    ...overrides,
  };
}

const BASE_RESULTS: KmindexResults = {
  hits: [hit()],
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

type SearchOverrides = Partial<
  Pick<Search, "goToPage" | "isLoadingResults" | "setPageSize" | "setSort">
>;

/**
 * A search-hook stub carrying only what the card reads: the payload, the
 * paging and sorting actions, and whether a fetch is in flight.
 * @param results - Payload as the API sends it. Typed loosely because the
 * old-backend case is precisely a payload missing keys the type declares.
 * @param overrides - Stub fields a case cares about.
 * @returns The stubbed hook return.
 */
function searchStub(results: unknown, overrides: SearchOverrides = {}): Search {
  return {
    error: null,
    goToPage: jest.fn(),
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: BASE_RESULTS.job_id,
    jobStatus: null,
    pageSize: PAGE_SIZE,
    reset: jest.fn(),
    results,
    setPageSize: jest.fn(),
    setSort: jest.fn(),
    // Deliberately a column no response payload in this file applies, so a
    // component reading the requested sort rather than the applied one lights
    // a header the tests below do not expect instead of passing on a
    // coincidence.
    sort: { column: "country", order: "asc" },
    submit: jest.fn(),
    ...overrides,
  } as unknown as Search;
}

/**
 * Render the results card around a payload.
 * @param results - Payload as the API sends it.
 * @param overrides - Stub fields a case cares about.
 * @returns The render result, plus the action stubs the card was handed.
 */
function renderResults(
  results: unknown,
  overrides: SearchOverrides = {}
): ReturnType<typeof render> & {
  actions: Pick<Search, "goToPage" | "setPageSize" | "setSort">;
} {
  const search = searchStub(results, overrides);
  return {
    ...render(<LoganSearchResults search={search} />),
    actions: search,
  };
}

/**
 * Open the "Why?" disclosure. The Collapse unmounts its children, so every
 * assertion on the truncation copy has to open it first.
 */
function openWhy(): void {
  fireEvent.click(screen.getByRole("button", { name: "Why?" }));
}

describe("LoganSearchResults truncation disclosure", () => {
  test("names the window it lists and what cannot be paged to", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    // The match count itself is the summary strip's line, directly above.
    // Restating it here would put the same number on screen twice.
    expect(
      screen.getByText("Listing the 50,000 highest-coverage hits")
    ).toBeTruthy();
    expect(container.textContent).not.toContain("of 1,133,516 matched");
    expect(container.textContent).toContain(
      "The remaining 1,083,516 cannot be paged to."
    );
  });

  test("keeps the explanation closed until asked", () => {
    renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );

    // Four paragraphs of caveat above every result taught readers to scroll
    // past the whole card; behind a toggle they are still one click away.
    expect(screen.queryByText(/does not re-rank/)).toBeNull();
    expect(screen.getByRole("button", { name: "Why?" })).toBeTruthy();
  });

  test("points the Why? button at the disclosure it opens", () => {
    renderResults(truncatedResults([summary("GENOMIC_VRL", 157741, CAP)]));

    // aria-expanded without aria-controls tells a screen reader something
    // opened but not what, which is the half of the announcement it cannot
    // work out for itself.
    const button = screen.getByRole("button", { name: "Why?" });
    expect(button.getAttribute("aria-controls")).toBe("logan-why-capped");
    openWhy();
    expect(document.getElementById("logan-why-capped")).not.toBeNull();
  });

  test("closes the explanation when another search lands", () => {
    const { rerender } = renderResults(
      truncatedResults([summary("GENOMIC_VRL", 157741, CAP)])
    );
    openWhy();
    expect(screen.getByRole("button", { name: "Hide why" })).toBeTruthy();

    rerender(
      <LoganSearchResults
        search={searchStub({
          ...truncatedResults([summary("GENOMIC_BCT", 1100404, CAP)]),
          job_id: "0c1d2e3f4a5b6c7d",
        })}
      />
    );

    // Keyed on the job: a disclosure opened over one search's numbers must
    // not stand open over the next search's.
    expect(screen.getByRole("button", { name: "Why?" })).toBeTruthy();
  });

  test("says the threshold does not re-rank the listing", () => {
    const { container } = renderResults(
      truncatedResults([
        summary("GENOMIC_BCT", 1100404, 47089),
        summary("METATRANSCRIPTOMIC_BCT", 33112, 2911),
      ])
    );
    openWhy();

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
    openWhy();

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
    openWhy();

    expect(container.textContent).toContain(
      "METAGENOMIC_UNKNOWN: 39 matched, none listed -- alone it would return all 39"
    );
    expect(container.textContent).toContain("METAGENOMIC_PHG: no matches");
  });

  test("still carries an explanation when only one index was searched", () => {
    const { container } = renderResults(
      truncatedResults([summary("GENOMIC_VRL", 157741, CAP)])
    );
    openWhy();

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
    openWhy();

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
    openWhy();

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

    expect(screen.getByText("All 17,633 hits")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Why?" })).toBeNull();
    // The per-index counts went with the diagnostics chips: an untruncated
    // listing has nothing to explain, and the toolbar names its window only.
    expect(container.textContent).not.toContain("GENOMIC_EUK 17,000");
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

    expect(
      screen.getByText("Listing the 50,000 highest-coverage hits")
    ).toBeTruthy();
    expect(container.textContent).toContain(
      "More accessions matched than can be listed."
    );
    openWhy();
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

    expect(screen.getByText("All 17 hits")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.textContent).not.toContain("NaN");
  });
});

describe("SRA mirror caption", () => {
  const PARTLY_ANNOTATED = {
    ...BASE_RESULTS,
    hits: [hit({ sra: sraMeta() }), hit({ accession: "SRR000002" })],
    sra_annotated: 1,
    sra_mirror_available: true,
    total_hits: 2,
    total_matches: 2,
  };

  test("describes the mirror as all of SRA, not a BRC-filtered subset", () => {
    renderResults(PARTLY_ANNOTATED);

    const caption = screen.getByText(
      /Metadata found for 1 of 2 rows on this page/
    );
    const title = caption.getAttribute("title") ?? "";
    expect(title).toBe(MIRROR_SCOPE_NOTE);
    // The deployed mirror is every run in SRA when it was built (v6:
    // 44,057,338 runs). The old copy told users to expect misses that
    // should never happen, and made a real annotation failure read as normal.
    expect(title).not.toMatch(/BRC-relevant/i);
    expect(title).toMatch(/every run|all of SRA/i);
    expect(title).toMatch(/newer than the mirror/i);
  });

  test("says nothing when the mirror answered for every row on the page", () => {
    const { container } = renderResults({
      ...PARTLY_ANNOTATED,
      sra_annotated: 2,
    });

    // A diagnostic that reads 2 of 2 every time is noise; it earns its line
    // only when the mirror missed something.
    expect(container.textContent).not.toContain("Metadata found for");
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
    const chip = marker.closest("[aria-label]");
    const label = chip?.getAttribute("aria-label");
    expect(label).toContain("kmindex reported 0.9900");
    expect(label).toContain("0.6910");
    // The tooltip is the only place the raw ratio is stated, so the chip has
    // to be reachable without a pointer.
    expect(chip?.getAttribute("tabindex")).toBe("0");
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
    // an fp_correction -- ahead of the rail, so the rail and the digits stay
    // in column against the rows that carry no chip.
    expect(cells[1].textContent).toBe("corrected-0.0500");
  });
});

describe("the hit table", () => {
  test("shows the coverage as a rail proportional to the score", () => {
    const { container } = renderResults({
      ...BASE_RESULTS,
      hits: [hit({ score: 0.8915 }), hit({ accession: "SRR000002", score: 1 })],
      total_hits: 2,
      total_matches: 2,
    });

    // The rail is decoration for the number beside it, so it is hidden from
    // assistive tech and reachable only as a rendered width.
    const rails = container.querySelectorAll<HTMLElement>(
      "span[aria-hidden='true'] > span"
    );
    expect(rails).toHaveLength(2);
    expect(rails[0].style.width).toBe("89%");
    expect(rails[1].style.width).toBe("100%");
  });

  test("pages from the top of the table as well as the bottom", () => {
    renderResults({ ...BASE_RESULTS, limit: 50, offset: 100, total_hits: 400 });

    // A hundred rows is a long way back to the only pager.
    expect(screen.getAllByText(/rows per page/i)).toHaveLength(2);
    expect(screen.getAllByText(/101.150 of 400/)).toHaveLength(2);
  });

  test("groups the digits in the pagination caption", () => {
    renderResults({ ...BASE_RESULTS, total_hits: 17629, total_matches: 17629 });

    // Top and bottom. Every other figure on the card is grouped, so an
    // unformatted "1-25 of 17629" reads as a different kind of number.
    expect(screen.getAllByText("1-25 of 17,629")).toHaveLength(2);
  });

  test("marks the table as busy while a page or a sort is in flight", () => {
    renderResults(BASE_RESULTS, { isLoadingResults: true });

    // The status card carried a caption during the first fetch and nothing
    // after it, so paging and sorting happened with no sign anything had.
    expect(screen.getByRole("progressbar")).toBeTruthy();
    const busy = screen.getByRole("table").closest("[aria-busy]");
    expect(busy?.getAttribute("aria-busy")).toBe("true");
  });

  test("shows no pending bar once the rows have landed", () => {
    renderResults(BASE_RESULTS);

    expect(screen.queryByRole("progressbar")).toBeNull();
    const busy = screen.getByRole("table").closest("[aria-busy]");
    expect(busy?.getAttribute("aria-busy")).toBe("false");
  });

  test("leaves no empty line under an organism with no metadata", () => {
    renderResults(BASE_RESULTS);

    // The metadata line the narrow layout adds is not rendered at all rather
    // than rendered empty: an empty caption still takes a line box.
    const row = screen.getByText("SRR000001").closest("tr");
    const cells = within(row as HTMLElement).getAllByRole("cell");
    expect(cells[3].childElementCount).toBe(1);
  });

  test("dims a metadata value the mirror did not have", () => {
    renderResults({
      ...BASE_RESULTS,
      hits: [hit({ sra: sraMeta({ country: null }) })],
      sra_annotated: 1,
      sra_mirror_available: true,
    });

    const row = screen.getByText("Plasmodium falciparum").closest("tr");
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole("cell");

    // Accession, coverage, ANI, organism, platform, country, released. The
    // country is the one the mirror had nothing for.
    expect(cells[4].textContent).toBe("ILLUMINA");
    expect(cells[5].textContent).toBe("--");
    expect(cells[6].textContent).toBe("2018-07-25");
  });

  test("repeats the metadata columns as one line under the organism", () => {
    renderResults({
      ...BASE_RESULTS,
      hits: [hit({ sra: sraMeta() })],
      sra_annotated: 1,
      sra_mirror_available: true,
    });

    // jsdom applies no media queries, so both layouts are in the document at
    // once and CSS picks between them; this asserts the narrow one exists.
    expect(screen.getByText("ILLUMINA, Malawi, 2018-07-25")).toBeTruthy();
    const row = screen.getByText("Plasmodium falciparum").closest("tr");
    const cells = within(row as HTMLElement).getAllByRole("cell");
    expect(cells[3].childElementCount).toBe(2);
  });

  test("does not decorate every row with an icon", () => {
    const { container } = renderResults(BASE_RESULTS);

    // Twenty-five external-link icons a page is chrome; the link tells a
    // screen reader where it goes instead.
    expect(
      container.querySelectorAll("svg[data-testid='OpenInNewIcon']")
    ).toHaveLength(0);
    expect(
      screen.getByRole("link", {
        name: "SRR000001 (opens NCBI SRA in a new tab)",
      })
    ).toBeTruthy();
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

  test("the lit header is the one the response says it sorted by", () => {
    // The mirror answered, so the applied sort is the requested one.
    renderResults({ ...BASE_RESULTS, order: "asc", sort: "organism" });

    const organismHeader = screen.getByText("Organism").closest("th");
    const scoreHeader = screen.getByText("k-mer coverage").closest("th");
    expect(organismHeader?.getAttribute("aria-sort")).toBe("ascending");
    expect(scoreHeader?.getAttribute("aria-sort")).toBeNull();
  });

  test("offers 25, 50 and 100 rows per page and reports a change", () => {
    const { actions } = renderResults({ ...BASE_RESULTS, limit: 50 });

    const [select] = screen.getAllByRole("combobox", {
      name: /rows per page/i,
    });
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
    expect(screen.getAllByText(/101.150 of 400/)[0]).toBeTruthy();
  });
});
