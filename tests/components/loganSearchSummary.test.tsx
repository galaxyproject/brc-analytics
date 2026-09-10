import { LoganSearchSummary } from "@brc/components/LoganSearch/LoganSearchSummary/loganSearchSummary";
import { API_BASE_URL } from "@repo/shared/config/api";
import {
  type KmindexCohort,
  type KmindexIndexSummary,
  type KmindexResults,
  PAGE_SIZE,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { act, fireEvent, render, screen } from "@testing-library/react";

// The component reaches into the hook module for its types, and that module
// imports ky, which ships ESM only and Jest cannot parse.
jest.mock("ky", () => ({ __esModule: true, default: {} }));

type Search = ReturnType<typeof useKmindexSearch>;

// The same real kmindex job the cohort card is tested against -- a bacterial
// 16S fragment at threshold 0.5 across GENOMIC_BCT + METATRANSCRIPTOMIC_BCT --
// counted over the full pre-cap match set, not the 50,000 rows that survive.
const CAP = 50000;
const TOTAL = 1133516;
const IN_MIRROR = 1128472;
const JOB_ID = "dee9dc267ca2a401";

const COHORT: KmindexCohort = {
  bioprojects: 19014,
  countries: 186,
  facets: [],
  in_mirror: IN_MIRROR,
  organisms: 10927,
  studies: 19148,
  top_organisms: [],
  total: TOTAL,
};

const BASE_RESULTS: KmindexResults = {
  cohort: COHORT,
  hits: [],
  job_id: JOB_ID,
  limit: PAGE_SIZE,
  offset: 0,
  per_index: [],
  query_name: "16S",
  shards_failed: 0,
  shards_searched: 84,
  shards_with_hits: 84,
  sra_annotated: 0,
  sra_mirror_available: true,
  // The cap bit: the table can show 50,000 of the 1,133,516 that matched.
  total_hits: CAP,
  total_matches: TOTAL,
  truncated: true,
};

// The same job with the enriched export materialized. Both numbers come from
// running the backend's own export writer over the real 84-shard corpus
// against the real mirror: 1,133,516 rows, 15.6 MB of zstd parquet, which the
// same code streams back as 168.0 MB of TSV.
const WITH_EXPORT: KmindexResults = {
  ...BASE_RESULTS,
  export_bytes: 15600000,
  export_rows: TOTAL,
  export_status: "available",
};

const EXPORT_URL = `${API_BASE_URL}/galaxy/kmindex/jobs/${JOB_ID}/export`;

// MUI hands a string tooltip to the child as its aria-label, so this is the
// name the assistant link answers to as well as the text on hover.
const ASSISTANT_TOOLTIP =
  "The assistant can explain what this cohort is, say which of its organisms " +
  "are in BRC, and set up a Galaxy analysis on the top runs.";

// jsdom has no clipboard, so the copy cases install one. Put back whatever
// was there, or the stub outlives the case that needed it.
const CLIPBOARD = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  if (CLIPBOARD) Object.defineProperty(navigator, "clipboard", CLIPBOARD);
  else delete (navigator as { clipboard?: unknown }).clipboard;
});

/**
 * Per-index shorthand.
 * @param index - Index name as the API sends it.
 * @param before - Hits the index matched before the cap.
 * @param after - Hits of that index that survived the cap.
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
 * A search-hook stub carrying only what the strip reads.
 * @param overrides - Fields to set on top of an idle search. Typed loosely
 * because the old-backend cases are precisely payloads missing keys the type
 * declares.
 * @returns The stubbed hook return.
 */
function search(overrides: Record<string, unknown>): Search {
  return {
    error: null,
    goToPage: jest.fn(),
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: null,
    jobStatus: null,
    reset: jest.fn(),
    results: null,
    submit: jest.fn(),
    ...overrides,
  } as unknown as Search;
}

/**
 * Render the strip around a payload; the component reads only the job id and
 * the results.
 * @param results - Payload as the API sends it.
 * @returns The render result.
 */
function renderSummary(results: unknown): ReturnType<typeof render> {
  return render(
    <LoganSearchSummary search={search({ jobId: JOB_ID, results })} />
  );
}

describe("LoganSearchSummary", () => {
  test("renders nothing before results", () => {
    const { container } = renderSummary(null);

    expect(container.innerHTML).toBe("");
  });

  test("renders nothing without a job id", () => {
    const { container } = render(
      <LoganSearchSummary search={search({ results: BASE_RESULTS })} />
    );

    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when the query matched nothing", () => {
    // The table's own empty-state Alert already says so, and a strip headed
    // "0 runs matched" above it would say it twice.
    const { container } = renderSummary({
      ...BASE_RESULTS,
      cohort: null,
      total_hits: 0,
      total_matches: 0,
      truncated: false,
    });

    expect(container.innerHTML).toBe("");
  });

  test("leads with the match count and the four figures", () => {
    const { container } = renderSummary(BASE_RESULTS);

    expect(
      screen.getByRole("heading", { name: "1,133,516 runs matched" })
    ).toBeTruthy();
    expect(screen.getByText("10,927")).toBeTruthy();
    expect(screen.getByText("19,014")).toBeTruthy();
    expect(screen.getByText("19,148")).toBeTruthy();
    expect(screen.getByText("186")).toBeTruthy();
    expect(container.textContent).toContain("organisms");
    expect(container.textContent).toContain("BioProjects");
    expect(container.textContent).toContain("SRA studies");
    expect(container.textContent).toContain("countries");
  });

  test("names the match count from total_matches, not the capped total_hits", () => {
    const { container } = renderSummary(BASE_RESULTS);

    // total_hits is 50,000 here. Leading with it would name the window the
    // table pages through as though it were the search's answer.
    expect(container.textContent).toContain("1,133,516 runs matched");
    expect(container.textContent).not.toContain("50,000 runs matched");
  });

  test("falls back to total_hits on a backend that sends no match count", () => {
    const legacy: Record<string, unknown> = {
      ...BASE_RESULTS,
      cohort: null,
      total_hits: 17633,
      truncated: false,
    };
    delete legacy.total_matches;

    const { container } = renderSummary(legacy);

    expect(container.textContent).toContain("17,633 runs matched");
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("undefined");
  });

  test("still leads with the count when the mirror sent no cohort", () => {
    const { container } = renderSummary({ ...BASE_RESULTS, cohort: null });

    // The count comes from the search, the figures from the mirror; losing
    // the second must not take the first with it.
    expect(container.textContent).toContain("1,133,516 runs matched");
    expect(container.textContent).not.toContain("BioProjects");
  });

  test("names the job and the query it ran", () => {
    renderSummary(BASE_RESULTS);

    // Two captions rather than one line joined by a dot: the row they sit in
    // already spaces them, and the dot was doing the job twice.
    expect(screen.getByText(`Job ${JOB_ID}`)).toBeTruthy();
    expect(screen.getByText("Query 16S")).toBeTruthy();
  });

  test("names the job alone when the query was not named", () => {
    const { container } = renderSummary({
      ...BASE_RESULTS,
      query_name: null,
    });

    expect(container.textContent).toContain(`Job ${JOB_ID}`);
    expect(container.textContent).not.toContain("Query");
  });

  test("links to the assistant with the job id", () => {
    renderSummary(BASE_RESULTS);

    // Sentence case, not the theme capitalisation of the old label, and short
    // enough that the sentence explaining it moves to a tooltip -- which MUI
    // then hands to the link as its accessible name.
    const link = screen.getByText("Ask the assistant").closest("a");
    expect(link?.getAttribute("href")).toBe(`/assistant?loganJob=${JOB_ID}`);
    expect(link?.getAttribute("aria-label")).toBe(ASSISTANT_TOOLTIP);
  });

  test("copies the results link", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderSummary(BASE_RESULTS);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    });

    // The job id is in the URL, so the link is the whole result: sharing it
    // reopens this search rather than the empty form.
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  test("says so when the browser refuses the clipboard", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });

    renderSummary(BASE_RESULTS);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    });

    // No clipboard outside a secure context, and an unguarded await there is
    // an unhandled rejection under a button that appears to do nothing.
    expect(screen.getByRole("button", { name: "Copy failed" })).toBeTruthy();
  });

  test("names the index it searched", () => {
    const { container } = renderSummary({
      ...BASE_RESULTS,
      per_index: [summary("GENOMIC_INV", 17629, 17629)],
    });

    // One index: the count is the match count already in the headline, so
    // only the name is worth saying.
    expect(container.textContent).toContain("Searched GENOMIC_INV");
    expect(container.textContent).not.toContain("(17,629 matched)");
  });

  test("splits the match count across indexes, largest first", () => {
    const { container } = renderSummary({
      ...BASE_RESULTS,
      per_index: [
        summary("METAGENOMIC_INV", 4, 4),
        summary("GENOMIC_INV", 17629, 17629),
      ],
    });

    // Selection order buries which index got swamped by which.
    expect(container.textContent).toContain(
      "Searched GENOMIC_INV (17,629 matched), METAGENOMIC_INV (4 matched)"
    );
  });

  test("says nothing about indexes when the backend sent no breakdown", () => {
    const legacy: Record<string, unknown> = { ...BASE_RESULTS };
    delete legacy.per_index;

    const { container } = renderSummary(legacy);

    expect(container.textContent).not.toContain("Searched");
  });
});

describe("the summary's export", () => {
  test("offers no download when the backend sends no export fields", () => {
    const { container } = renderSummary(BASE_RESULTS);

    // The strip still renders -- the counts do not depend on the file.
    expect(container.textContent).toContain("1,133,516 runs matched");
    expect(screen.queryAllByRole("link", { name: /^Download all/ })).toEqual(
      []
    );
    expect(container.textContent).not.toContain("Download");
  });

  test("offers no download when the export was not materialized", () => {
    const { container } = renderSummary({
      ...BASE_RESULTS,
      export_bytes: null,
      export_rows: null,
      export_status: "unavailable",
    });

    // No disabled button, no tooltip explaining an absence nobody can fix.
    expect(screen.queryAllByRole("link", { name: /^Download all/ })).toEqual(
      []
    );
    expect(container.textContent).not.toContain("Download");
  });

  test("says a narrower query brings the download back when the set was too large", () => {
    const { container } = renderSummary({
      ...BASE_RESULTS,
      export_bytes: null,
      export_rows: null,
      export_status: "too_large",
    });

    // The one absence with a cause the reader can act on, so it is the one
    // absence worth a sentence -- still no control.
    expect(container.textContent).toContain(
      "Too many matched runs to prepare a download of the full set. A higher minimum shared k-mer fraction, or fewer indexes, brings one back."
    );
    expect(screen.queryAllByRole("link", { name: /^Download all/ })).toEqual(
      []
    );
  });

  test("links both formats at the export endpoint for this job", () => {
    renderSummary(WITH_EXPORT);

    const tsv = screen.getByRole("link", {
      name: "Download all 1,133,516 matched runs as TSV",
    });
    const parquet = screen.getByRole("link", {
      name: "Download all 1,133,516 matched runs as Parquet",
    });

    expect(tsv.getAttribute("href")).toBe(`${EXPORT_URL}?format=tsv`);
    expect(parquet.getAttribute("href")).toBe(`${EXPORT_URL}?format=parquet`);
    // Plain anchors, not fetch-then-blob: streaming 160 MB is the browser's
    // job, so neither download may be a scripted button.
    expect(tsv.hasAttribute("download")).toBe(true);
    expect(parquet.hasAttribute("download")).toBe(true);
    expect(tsv.tagName).toBe("A");
    expect(parquet.tagName).toBe("A");
  });

  test("states the parquet size and marks the TSV size as derived", () => {
    const { container } = renderSummary(WITH_EXPORT);

    // Parquet is the size the API reports, stated flatly. TSV never exists as
    // a file to measure, so it is derived from the row count at the measured
    // 148 B/row and marked as the estimate it is -- landing on the 168.0 MB
    // the backend's own writer actually produces for these rows.
    expect(container.textContent).toContain("TSV · ~168 MB");
    expect(container.textContent).toContain("Parquet · 15.6 MB");
  });

  test("does not send a million-row export to a spreadsheet", () => {
    // Excel and Calc stop at 1,048,576 rows and drop the tail behind one
    // dismissable warning. This export exists because the 50,000 rows on
    // screen misrepresent the match set, so recommending a format that
    // silently truncates would put the same problem back in a new place --
    // and the measured job is 1,133,516 rows, 84,941 past the limit.
    const { container } = renderSummary(WITH_EXPORT);

    expect(container.textContent).toContain("Too many rows for a spreadsheet");
    expect(container.textContent).not.toContain("opens in a spreadsheet");
  });

  test("still recommends TSV when the set does fit in a spreadsheet", () => {
    const { container } = renderSummary({
      ...WITH_EXPORT,
      cohort: { ...COHORT, in_mirror: 17566, total: 17633 },
      export_bytes: 260000,
      export_rows: 17633,
      total_matches: 17633,
    });

    expect(container.textContent).toContain("TSV opens in a spreadsheet");
    expect(container.textContent).not.toContain("Too many rows");
  });

  test("promises the whole match set rather than the rows in the table", () => {
    const { container } = renderSummary(WITH_EXPORT);

    // The strip is about the match set, so the file it offers is the whole of
    // it. The count is the headline directly above, and the buttons keep it
    // in their labels, so the caption does not say it a third time.
    expect(container.textContent).toContain(
      "Download every matched run with its SRA metadata"
    );
    expect(container.textContent).not.toContain(
      "Download all 1,133,516 matched runs with"
    );
  });

  test("says the file joins metadata for every row when nothing was cut", () => {
    const whole = 17633;
    const { container } = renderSummary({
      ...WITH_EXPORT,
      cohort: { ...COHORT, in_mirror: whole, total: whole },
      // Small enough to land under a megabyte, the one band the megabyte
      // formatting cannot carry.
      export_bytes: 243000,
      export_rows: whole,
      total_hits: whole,
      total_matches: whole,
      truncated: false,
    });

    expect(container.textContent).toContain(
      "Download every matched run with its SRA metadata"
    );
    expect(container.textContent).toContain("TSV · ~2.6 MB");
    expect(container.textContent).toContain("Parquet · 243 kB");
    // Full mirror coverage: nothing to warn about, so nothing said.
    expect(container.textContent).not.toContain("with those columns empty");
  });

  test("sizes the largest export the ceiling permits without four figures of megabytes", () => {
    // The backend refuses to materialize past EXPORT_MAX_ROWS = 5,000,000, so
    // this is the biggest download that can actually be offered: ~740 MB of
    // TSV. Sized at the ceiling rather than at some larger number the ceiling
    // forbids, so this test keeps failing if the two ever drift apart.
    const ceiling = 5000000;
    const { container } = renderSummary({
      ...WITH_EXPORT,
      cohort: { ...COHORT, in_mirror: ceiling, total: ceiling },
      // Measured at the real ceiling against the real mirror: 84 MB parquet.
      export_bytes: 84000000,
      export_rows: ceiling,
      total_matches: ceiling,
    });

    expect(container.textContent).toContain("TSV · ~740 MB");
    expect(container.textContent).toContain("Parquet · 84.0 MB");
  });

  test("admits the rows that carry a hit but no metadata are in the file too", () => {
    const { container } = renderSummary(WITH_EXPORT);

    // 5,044 of 1,133,516. The cohort card states the coverage share at
    // greater weight; this only says what it means for the file.
    expect(container.textContent).toContain(
      "Includes the 5,044 runs the mirror has no metadata for, with those columns empty."
    );
  });

  test("says nothing about missing metadata when the mirror sent no cohort", () => {
    const { container } = renderSummary({ ...WITH_EXPORT, cohort: null });

    // Without a cohort there is no coverage to subtract, and guessing at one
    // would put a number on the page that nothing measured.
    expect(container.textContent).toContain("TSV · ~168 MB");
    expect(container.textContent).not.toContain("has no metadata for");
  });
});
