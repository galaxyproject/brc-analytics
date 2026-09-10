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

// The same job's release years, count-descending as the API sends them, with
// 2013, 2014 and 2016 absent because nothing matched in them. Sums to
// IN_MIRROR: every run with metadata has a release date.
const RELEASE_YEAR_FACET = facet(
  "release_year",
  [
    ["2021", 402118],
    ["2020", 288440],
    ["2022", 201377],
    ["2019", 118206],
    ["2023", 62109],
    ["2018", 41028],
    ["2024", 9110],
    ["2017", 4102],
    ["2015", 1901],
    ["2012", 81],
  ],
  0,
  0
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
    RELEASE_YEAR_FACET,
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

  test("leads with the match count and leaves the figures to the summary", () => {
    const { container } = renderCohort(BASE_RESULTS);

    // The heading names the set the card counts over, which is the whole
    // match set and not the window the table pages through.
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "How the 1,133,516 matched runs break down",
      })
    ).toBeTruthy();
    // Organisms, BioProjects, SRA studies and countries are four measurements
    // of the same set the summary strip above already leads with, and each
    // number gets one place on the page.
    expect(screen.queryByText("19,014")).toBeNull();
    expect(screen.queryByText("19,148")).toBeNull();
    expect(screen.queryByText("186")).toBeNull();
    expect(container.textContent).not.toContain("BioProjects");
    expect(container.textContent).not.toContain("SRA studies");
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

    // The table sits above this card, so "below" would send the reader the
    // wrong way as well as describing the wrong set.
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(container.textContent).toContain(
      "These counts describe the whole match set, not the table above."
    );
    // The heading above it already opens with N, so the paragraph says what
    // it counts rather than counting it again.
    expect(container.textContent).toContain(
      "Every matched run is counted here. The table above lists 50,000 of them: the top of the score range, which over-represents whatever is common at the top."
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

    // Nothing was cut, so there is nothing to warn about: one sentence
    // saying what was counted, and no Alert standing over the whole card.
    expect(container.textContent).toContain(
      "Counted over every matched run, which the table above pages through a screen at a time."
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.textContent).not.toContain(
      "These counts describe the whole match set"
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

    // All three facets name the same denominator, and each adds up to it --
    // the release-year timeline included, which states its own total the
    // same way the bar blocks do.
    const rowCounts = [
      ...COUNTRY_FACET.values.map(({ count }) => count),
      COUNTRY_FACET.other,
      COUNTRY_FACET.unknown,
    ];
    expect(rowCounts.reduce((a, b) => a + b, 0)).toBe(IN_MIRROR);
    expect(screen.getAllByText("1,128,472 runs")).toHaveLength(3);
  });

  test("draws release year as a timeline instead of a row in the facet grid", () => {
    const { container } = renderCohort(BASE_RESULTS);

    // The grid ranks a facet's values by count, which for a year is a
    // ranking of the calendar. Release year leaves the grid entirely.
    const grid =
      screen.getByText("Library layout").parentElement?.parentElement;
    expect(grid?.textContent).toContain("Country of origin");
    expect(grid?.textContent).not.toContain("Release year");
    expect(
      screen.getByRole("img", {
        name: "Runs released per year, 2012 to 2024; most in 2021, with 402,118",
      })
    ).toBeTruthy();
    // Thirteen years, three of them empty, each carrying its own count.
    expect(screen.getByTitle("2021: 402,118 runs")).toBeTruthy();
    expect(screen.getByTitle("2016: 0 runs")).toBeTruthy();
    // A grid row would have put that count and its share on the page as
    // visible text; the timeline draws the shape and leaves the numbers to
    // the hidden list a screen reader reads.
    expect(
      screen.getByText("2021: 402,118 runs", { selector: "li" })
    ).toBeTruthy();
    expect(container.textContent).not.toContain("35.6%");
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
      "Counts only. These values are not filters -- narrowing by one would have to run over the whole match set to stay honest."
    );
    // The claim that has to survive is about the breakdowns, not about the
    // card: the download and the assistant live in the summary strip above.
    expect(container.textContent).not.toContain("nothing here is clickable");
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
      "Counts only. These values are not filters -- narrowing by one would have to run over the whole match set to stay honest."
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
