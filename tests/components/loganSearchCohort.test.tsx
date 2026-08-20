import { LoganSearchCohort } from "@brc/components/LoganSearch/LoganSearchCohort/loganSearchCohort";
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
      "Counts only, nothing here is clickable."
    );
  });
});
