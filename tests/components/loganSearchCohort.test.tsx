import { LoganSearchCohort } from "@brc/components/LoganSearch/LoganSearchCohort/loganSearchCohort";
import { API_BASE_URL } from "@repo/shared/config/api";
import {
  type KmindexCohort,
  type KmindexFacet,
  type KmindexResults,
  PAGE_SIZE,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { render, screen } from "@testing-library/react";

// The component reaches into the hook module for its types, and that module
// imports ky, which ships ESM only and Jest cannot parse.
jest.mock("ky", () => ({ __esModule: true, default: {} }));

// The geography block imports vega-embed dynamically. jsdom cannot render an
// SVG projection, and the spec itself is covered in cohortGeography.test.tsx.
jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({ finalize: jest.fn() })),
}));

type Search = ReturnType<typeof useKmindexSearch>;

// Every number below is from one real kmindex job -- a bacterial 16S fragment
// at threshold 0.5 across GENOMIC_BCT + METATRANSCRIPTOMIC_BCT -- counted over
// the full pre-cap match set rather than the 50,000 rows that survive the cap.
const CAP = 50000;
const TOTAL = 1133516;
const IN_MIRROR = 1128472;

/**
 * Facet shorthand.
 * @param name - Facet name as the API sends it.
 * @param values - Listed values, largest first, as [value, count] pairs.
 * @param other - Rows outside the listed values.
 * @param unknown - Rows with no value for this facet.
 * @returns A facet row as the API sends it.
 */
function facet(
  name: string,
  values: [string, number][],
  other: number,
  unknown: number
): KmindexFacet {
  return {
    name,
    other,
    unknown,
    values: values.map(([value, count]) => ({ count, value })),
  };
}

// Country is the facet that matters most here: 21.6% of the matched runs have
// no usable geography, once "uncalculated" is folded into unknown.
const COUNTRY_FACET = facet(
  "country",
  [
    ["USA", 546121],
    ["United Kingdom", 115419],
    ["Canada", 26029],
    ["Australia", 24948],
    ["China", 19629],
    ["Japan", 14211],
    ["Germany", 12882],
    ["France", 8104],
    ["South Africa", 7998],
    ["Denmark", 7388],
  ],
  101732,
  244011
);

const COHORT: KmindexCohort = {
  bioprojects: 19014,
  countries: 186,
  facets: [
    facet(
      "librarylayout",
      [
        ["PAIRED", 1091314],
        ["SINGLE", 37158],
      ],
      0,
      0
    ),
    COUNTRY_FACET,
  ],
  in_mirror: IN_MIRROR,
  organisms: 10927,
  studies: 19148,
  top_organisms: [
    { count: 329113, value: "Salmonella enterica" },
    { count: 296976, value: "Escherichia coli" },
  ],
  total: TOTAL,
};

const BASE_RESULTS: KmindexResults = {
  cohort: COHORT,
  hits: [],
  job_id: "dee9dc267ca2a401",
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

const EXPORT_URL = `${API_BASE_URL}/galaxy/kmindex/jobs/${BASE_RESULTS.job_id}/export`;

// Geography over the same 1,133,516-hit job. `unknown` is deliberately the
// country facet's own 244,011 -- the two are computed from one column with
// the same sentinel handling, so they cannot be allowed to disagree on the
// card they share. The rest is split so the parts reconcile: 661,540 runs in
// two drawable countries, 222,921 in one the map cannot place.
const GEOGRAPHY_UNKNOWN = 244011;
const GEOGRAPHY = {
  countries: [
    {
      count: 546121,
      iso_a3: "USA",
      iso_n3: "840",
      value: "United States of America",
    },
    { count: 115419, iso_a3: "GBR", iso_n3: "826", value: "United Kingdom" },
  ],
  in_mirror: IN_MIRROR,
  recorded: IN_MIRROR - GEOGRAPHY_UNKNOWN,
  unknown: GEOGRAPHY_UNKNOWN,
  unmapped_countries: [{ count: 222921, value: "Hong Kong" }],
};

const WITH_GEOGRAPHY: KmindexResults = {
  ...BASE_RESULTS,
  geography: GEOGRAPHY,
};

/**
 * Render the cohort card around a payload; the component reads only results,
 * so the rest of the search state is stubbed.
 * @param results - Payload as the API sends it. Typed loosely because the
 * old-backend case is precisely a payload missing keys the type declares.
 * @returns The render result.
 */
function renderCohort(results: unknown): ReturnType<typeof render> {
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
  return render(<LoganSearchCohort search={search} />);
}

describe("LoganSearchCohort", () => {
  test("renders nothing when the backend sends no cohort", () => {
    const legacy: Record<string, unknown> = { ...BASE_RESULTS };
    delete legacy.cohort;

    const { container } = renderCohort(legacy);

    // Not an empty card, not a skeleton, not a row of zeroes.
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when the cohort is null because the mirror was down", () => {
    const { container } = renderCohort({ ...BASE_RESULTS, cohort: null });

    expect(container.innerHTML).toBe("");
  });

  test("renders nothing before any results have arrived", () => {
    const { container } = renderCohort(null);

    expect(container.innerHTML).toBe("");
  });

  test("leads with the match count and the structure behind it", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(screen.getByText("1,133,516 runs")).toBeTruthy();
    expect(screen.getByText("10,927")).toBeTruthy();
    expect(screen.getByText("19,014")).toBeTruthy();
    expect(screen.getByText("19,148")).toBeTruthy();
    expect(screen.getByText("186")).toBeTruthy();
    expect(container.textContent).toContain("Every run this query matched");
  });

  test("names the top organism the capped table would miss", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(container.textContent).toContain("Salmonella enterica");
    expect(container.textContent).toContain("329,113");
    expect(container.textContent).toContain("29.2%");
    // Organism is not a facet, so the list has to admit what it leaves out.
    expect(container.textContent).toContain(
      "The 2 largest of 10,927 distinct organisms"
    );
    expect(container.textContent).toContain(
      "remaining 10,925 organisms are not listed"
    );
  });

  test("states mirror coverage rather than implying the counts cover everything", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(container.textContent).toContain(
      "covers 1,128,472 of the 1,133,516 matched runs (99.6%)"
    );
    expect(container.textContent).toContain(
      "The other 5,044 matched the query but the mirror does not know them"
    );
  });

  test("separates the cohort from the table when the cap bit", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(container.textContent).toContain(
      "These counts describe the whole match set, not the table below."
    );
    expect(container.textContent).toContain(
      "All 1,133,516 matched runs are counted here. The table below lists 50,000 of them: the top of the score range, which over-represents whatever is common at the top."
    );
    expect(container.textContent).toContain(
      "up to and including a different top organism"
    );
    // All 50,000 listed rows of this job score exactly 1.0, so the listing is
    // not ordered by score at all and "a ranking" is the wrong word. Within
    // that band it is also close to uniform, so "not a sample" is wrong too.
    // The skew is inherited from the band: E. coli is 70.2% of the 305,061
    // runs scoring 1.0 and 70.2% of the 50,000 listed, against 29.2%
    // Salmonella enterica over the whole match set.
    expect(container.textContent).not.toContain("a ranking and not a sample");
  });

  test("says the two agree when nothing was cut", () => {
    const whole = 17633;
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: { ...COHORT, in_mirror: whole, total: whole },
      total_hits: whole,
      total_matches: whole,
      truncated: false,
    });

    expect(container.textContent).toContain(
      "Nothing was cut: these counts and the 17,633 rows in the table below describe the same set of runs"
    );
    expect(container.textContent).not.toContain("over-represents");
  });

  test("shows a facet's unrecorded fifth as a row rather than dropping it", () => {
    const { container } = renderCohort(BASE_RESULTS);

    // 244,011 of 1,128,472 country values are missing -- including the
    // "uncalculated" sentinel -- and a chart that hid them would put the same
    // class of lie back on the page.
    expect(container.textContent).toContain("Not recorded");
    expect(container.textContent).toContain("244,011");
    expect(container.textContent).toContain("21.6%");
    // The tail outside the listed values is a row too.
    expect(container.textContent).toContain("All other values");
    expect(container.textContent).toContain("101,732");
  });

  test("accounts for every matched run in each facet it draws", () => {
    renderCohort(BASE_RESULTS);

    // Both facets name the same denominator, and both add up to it.
    const rowCounts = [
      ...COUNTRY_FACET.values.map(({ count }) => count),
      COUNTRY_FACET.other,
      COUNTRY_FACET.unknown,
    ];
    expect(rowCounts.reduce((a, b) => a + b, 0)).toBe(IN_MIRROR);
    expect(screen.getAllByText("1,128,472 runs")).toHaveLength(2);
  });

  test("omits the other and unrecorded rows when a facet has neither", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: { ...COHORT, facets: [COHORT.facets[0]] },
    });

    expect(container.textContent).toContain("Library layout");
    expect(container.textContent).toContain("96.7%");
    expect(container.textContent).not.toContain("Not recorded");
    expect(container.textContent).not.toContain("All other values");
  });

  test("keeps a non-zero share visible instead of rounding it to nothing", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: {
        ...COHORT,
        facets: [
          facet(
            "platform",
            [
              ["ILLUMINA", 1128471],
              ["HELICOS", 1],
            ],
            0,
            0
          ),
        ],
      },
    });

    // A run that matched is not a run that did not: 1 of 1,128,472 rounds to
    // 0.0% and has to render as under the floor instead.
    expect(container.textContent).toContain("<0.1%");
    // The same fixture is an instance of the ceiling bug: the other row is
    // 1,128,471 of 1,128,472, and "100.0%" above a "<0.1%" sums past 100%.
    expect(container.textContent).not.toContain("100.0%");
  });

  test("keeps a non-zero remainder visible instead of rounding it away", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: {
        ...COHORT,
        facets: [
          facet(
            "platform",
            [
              ["ILLUMINA", 999999],
              ["HELICOS", 1],
            ],
            0,
            0
          ),
        ],
      },
    });

    // The mirror image of the floor. 999,999 of 1,000,000 rounds to 100.0%,
    // which put on the page beside the other row's "<0.1%" makes a column
    // that sums past 100%.
    expect(container.textContent).toContain(">99.9%");
    expect(container.textContent).toContain("<0.1%");
    expect(container.textContent).not.toContain("100.0%");
  });

  test("does not report full mirror coverage in a sentence that names the runs it misses", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: { ...COHORT, in_mirror: 999600, total: 1000000 },
      total_matches: 1000000,
    });

    expect(container.textContent).toContain(
      "covers 999,600 of the 1,000,000 matched runs (>99.9%)"
    );
    expect(container.textContent).toContain(
      "The other 400 matched the query but the mirror does not know them"
    );
    expect(container.textContent).not.toContain("(100.0%)");
  });

  test("still says 100.0% when a value really is all of them", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      cohort: {
        ...COHORT,
        facets: [facet("platform", [["ILLUMINA", 1128472]], 0, 0)],
      },
    });

    // The guard is about rounding, not about the number 100: a facet with one
    // value and no tail genuinely is 100% of itself.
    expect(container.textContent).toContain("100.0%");
    expect(container.textContent).not.toContain(">99.9%");
  });

  test("does not offer facet values as filters", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll("input")).toHaveLength(0);
    expect(container.textContent).toContain(
      "Counts only -- these values are not filters."
    );
    // The card carries a download now, so the claim can no longer be that
    // nothing in it is clickable -- only that no breakdown is a control.
    expect(container.textContent).not.toContain("nothing here is clickable");
  });

  test("offers no download when the backend sends no export fields", () => {
    const { container } = renderCohort(BASE_RESULTS);

    // The card still renders -- the counts do not depend on the file.
    expect(container.textContent).toContain("1,133,516 runs");
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).not.toContain("Download");
  });

  test("offers no download when the export was not materialized", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      export_bytes: null,
      export_rows: null,
      export_status: "unavailable",
    });

    // No disabled button, no tooltip explaining an absence nobody can fix.
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).not.toContain("Download");
  });

  test("says a narrower query brings the download back when the set was too large", () => {
    const { container } = renderCohort({
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
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  test("links both formats at the export endpoint for this job", () => {
    const { container } = renderCohort(WITH_EXPORT);

    const tsv = screen.getByRole("link", {
      name: "Download all 1,133,516 matched runs as TSV",
    });
    const parquet = screen.getByRole("link", {
      name: "Download all 1,133,516 matched runs as Parquet",
    });

    expect(tsv.getAttribute("href")).toBe(`${EXPORT_URL}?format=tsv`);
    expect(parquet.getAttribute("href")).toBe(`${EXPORT_URL}?format=parquet`);
    // Plain anchors, not fetch-then-blob: streaming 160 MB is the browser's
    // job, so nothing in the card may be a scripted button.
    expect(tsv.hasAttribute("download")).toBe(true);
    expect(parquet.hasAttribute("download")).toBe(true);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  test("states the parquet size and marks the TSV size as derived", () => {
    const { container } = renderCohort(WITH_EXPORT);

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
    const { container } = renderCohort(WITH_EXPORT);

    expect(container.textContent).toContain("Too many rows for a spreadsheet");
    expect(container.textContent).not.toContain("opens in a spreadsheet");
  });

  test("still recommends TSV when the set does fit in a spreadsheet", () => {
    const { container } = renderCohort({
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
    const { container } = renderCohort(WITH_EXPORT);

    expect(container.textContent).toContain("Download the whole match set");
    expect(container.textContent).toContain(
      "All 1,133,516 matched runs with their SRA metadata, in one file -- the set these counts describe, not the 50,000 rows the table below pages through."
    );
  });

  test("says the file joins metadata the table only has for a page when nothing was cut", () => {
    const whole = 17633;
    const { container } = renderCohort({
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
      "All 17,633 matched runs with their SRA metadata, in one file -- the same set as the table below, joined to metadata for every row rather than the page on screen."
    );
    expect(container.textContent).toContain("TSV · ~2.6 MB");
    expect(container.textContent).toContain("Parquet · 243 kB");
    // Full mirror coverage: nothing to warn about, so nothing said.
    expect(container.textContent).not.toContain("metadata columns left empty");
  });

  test("sizes the largest export the ceiling permits without four figures of megabytes", () => {
    // The backend refuses to materialize past EXPORT_MAX_ROWS = 5,000,000, so
    // this is the biggest download that can actually be offered: ~740 MB of
    // TSV. Sized at the ceiling rather than at some larger number the ceiling
    // forbids, so this test keeps failing if the two ever drift apart.
    const ceiling = 5000000;
    const { container } = renderCohort({
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
    const { container } = renderCohort(WITH_EXPORT);

    // 5,044 of 1,133,516. The coverage share is already stated above at
    // greater weight; this only says what it means for the file.
    expect(container.textContent).toContain(
      "The 5,044 runs the mirror does not know are in it too, carrying their hit with the metadata columns left empty."
    );
  });
});

describe("the geography block", () => {
  test("is absent entirely when the backend sent no geography", () => {
    const { container } = renderCohort(BASE_RESULTS);

    expect(container.textContent).not.toContain("Where these runs came from");
    // And the country facet stays where it has always been rather than
    // leaving half a row empty.
    expect(container.textContent).toContain("Country of origin");
  });

  test("states the recorded/unknown split beside the map", () => {
    const { container } = renderCohort(WITH_GEOGRAPHY);

    expect(container.textContent).toContain("Where these runs came from");
    expect(container.textContent).toContain(
      "Geography recorded for 884,461 of 1,128,472 runs (78.4%)"
    );
    expect(container.textContent).toContain(
      "244,011 matched the query with no country recorded"
    );
  });

  test("displays the countries the map cannot place rather than dropping them", () => {
    const { container } = renderCohort(WITH_GEOGRAPHY);

    expect(container.textContent).toContain(
      "222,921 of those runs come from one place the map cannot colour"
    );
    expect(container.textContent).toContain("Hong Kong (222,921)");
  });

  test("keeps the country bars, once, beside the map rather than in the grid", () => {
    const { container } = renderCohort(WITH_GEOGRAPHY);

    // The bars answer a question the choropleth cannot -- "812 runs from
    // Malawi" -- so they stay. But they must not be rendered twice.
    const headings = container.textContent?.match(/Country of origin/g) ?? [];
    expect(headings).toHaveLength(1);
    // And the other facets are still in the grid below.
    expect(container.textContent).toContain("Library layout");
  });

  test("agrees with the country facet about how much is unrecorded", () => {
    // Both are computed from geo_loc_name_country_calc with the same sentinel
    // handling, and they render side by side. Two different numbers for "not
    // recorded" on one card would make both of them worthless.
    const { container } = renderCohort(WITH_GEOGRAPHY);

    expect(GEOGRAPHY.unknown).toBe(COUNTRY_FACET.unknown);
    expect(container.textContent).toContain("Not recorded244,011");
    expect(container.textContent).toContain(
      "244,011 matched the query with no country recorded"
    );
  });

  test("does not turn the map into a filter", () => {
    const { container } = renderCohort(WITH_GEOGRAPHY);

    // The card's standing contract. Narrowing by a country would have to run
    // over the whole match set to stay honest.
    expect(container.textContent).toContain(
      "Counts only -- these values are not filters."
    );
  });

  test("renders an explicit empty state rather than a blank world", () => {
    const { container } = renderCohort({
      ...BASE_RESULTS,
      geography: {
        ...GEOGRAPHY,
        countries: [],
        recorded: 0,
        unknown: IN_MIRROR,
        unmapped_countries: [],
      },
    });

    expect(container.textContent).toContain(
      "No country is recorded for any of the 1,128,472"
    );
    expect(container.textContent).toContain(
      "not one matched run has a country recorded"
    );
  });
});
