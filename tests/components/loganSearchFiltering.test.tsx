import {
  buildSpec,
  CohortGeography,
} from "@brc/components/LoganSearch/CohortGeography/cohortGeography";
import { CohortYears } from "@brc/components/LoganSearch/CohortYears/cohortYears";
import { LoganSearchCohort } from "@brc/components/LoganSearch/LoganSearchCohort/loganSearchCohort";
import {
  EMPTY_FILTERS,
  type LoganFilters,
  NONE_VALUE,
} from "@brc/components/LoganSearch/LoganSearchFilters/filters";
import { LoganSearchFilterBar } from "@brc/components/LoganSearch/LoganSearchFilters/loganSearchFilterBar";
import { type LoganFilterControls } from "@brc/components/LoganSearch/LoganSearchFilters/types";
import { type UseLoganFilters } from "@brc/components/LoganSearch/LoganSearchFilters/useLoganFilters";
import { LoganSearchResults } from "@brc/components/LoganSearch/LoganSearchResults/loganSearchResults";
import {
  type KmindexCohort,
  type KmindexGeography,
  type KmindexResults,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { type KmindexSummaryState } from "@repo/shared/hooks/useKmindexSummary";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("ky", () => ({ __esModule: true, default: {} }));

const mockAddEventListener = jest.fn();
jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({
    finalize: jest.fn(),
    view: { addEventListener: mockAddEventListener },
  })),
}));

type Search = ReturnType<typeof useKmindexSearch>;

const COHORT: KmindexCohort = {
  bioprojects: 3,
  countries: 2,
  facets: [
    {
      name: "platform",
      other: 4,
      unknown: 5,
      values: [
        { count: 60, value: "ILLUMINA" },
        { count: 31, value: "OXFORD_NANOPORE" },
      ],
    },
    {
      name: "release_year",
      other: 0,
      unknown: 0,
      values: [
        { count: 40, value: "2019" },
        { count: 60, value: "2021" },
      ],
    },
  ],
  in_mirror: 100,
  organisms: 2,
  studies: 3,
  top_organisms: [{ count: 70, value: "E. coli" }],
  total: 100,
};

const GEOGRAPHY: KmindexGeography = {
  countries: [{ count: 30, iso_a3: "KEN", iso_n3: "404", value: "Kenya" }],
  in_mirror: 100,
  recorded: 30,
  unknown: 70,
  unmapped_countries: [],
};

const RESULTS: KmindexResults = {
  cohort: COHORT,
  export_status: "available",
  geography: GEOGRAPHY,
  hits: [],
  job_id: "job1",
  limit: 25,
  offset: 0,
  per_index: [],
  query_name: "q",
  shards_failed: 0,
  shards_searched: 1,
  shards_with_hits: 1,
  sra_annotated: 0,
  sra_mirror_available: true,
  total_hits: 100,
  total_matches: 100,
  truncated: false,
};

const IDLE_SUMMARY: KmindexSummaryState = {
  error: null,
  isLoading: false,
  summary: null,
};

/**
 * A search stub around a results payload.
 * @param results - Payload.
 * @returns The stub.
 */
function searchOf(results: KmindexResults): Search {
  return {
    error: null,
    filterError: null,
    goToPage: jest.fn(),
    indexes: [],
    isLoadingIndexes: false,
    isLoadingResults: false,
    isSubmitting: false,
    jobId: results.job_id,
    jobStatus: null,
    pageSize: 25,
    reset: jest.fn(),
    results,
    setPageSize: jest.fn(),
    setSort: jest.fn(),
    sort: { column: "score", order: "desc" },
    submit: jest.fn(),
  } as unknown as Search;
}

/**
 * Filter controls with spies.
 * @param filters - Current filter.
 * @param disabledReason - Why filtering is off, if it is.
 * @returns The controls.
 */
function controlsOf(
  filters: Partial<LoganFilters> = {},
  disabledReason: string | null = null
): LoganFilterControls {
  return {
    disabledReason,
    filters: { ...EMPTY_FILTERS, ...filters },
    onToggle: jest.fn(),
    onToggleYear: jest.fn(),
  };
}

describe("flag off", () => {
  it("renders the cohort card read-only, with its old footnote", () => {
    render(<LoganSearchCohort search={searchOf(RESULTS)} />);

    expect(screen.queryAllByRole("button", { pressed: false })).toHaveLength(0);
    expect(
      screen.getByText(/Counts only\. These values are not filters/)
    ).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /Runs released per year/ })
    ).toBeTruthy();
  });

  it("builds the map spec exactly as before", () => {
    const spec = JSON.stringify(buildSpec(GEOGRAPHY.countries, []));
    expect(spec).not.toContain("datum.selected");
    expect(spec).toContain('"fields":["count","value"]');
    expect(spec).not.toContain("pointer");
  });

  it("does not listen for clicks on the map", async () => {
    mockAddEventListener.mockClear();
    render(<CohortGeography geography={GEOGRAPHY} />);
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mocked module
    const embed = require("vega-embed").default as jest.Mock;
    await waitFor(() => expect(embed).toHaveBeenCalled());
    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});

describe("cohort bars as filters", () => {
  it("toggles a value, and Not recorded as IS NULL", () => {
    const controls = controlsOf();
    render(
      <LoganSearchCohort
        filtering={controls}
        search={searchOf(RESULTS)}
        summary={IDLE_SUMMARY}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^ILLUMINA/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Not recorded/ }));

    expect(controls.onToggle).toHaveBeenCalledWith("platform", "ILLUMINA");
    expect(controls.onToggle).toHaveBeenCalledWith("platform", NONE_VALUE);
    // The tail is counted but is not a choice.
    expect(screen.queryByRole("button", { name: /^All other values/ })).toBe(
      null
    );
  });

  it("marks picked values as pressed", () => {
    render(
      <LoganSearchCohort
        filtering={controlsOf({ platform: ["OXFORD_NANOPORE"] })}
        search={searchOf({ ...RESULTS, filtered: true })}
        summary={{ ...IDLE_SUMMARY, summary: summaryOf(COHORT) }}
      />
    );

    expect(
      screen
        .getByRole("button", { name: /^OXFORD_NANOPORE/ })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: /^ILLUMINA/ })
        .getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("is inert, and says why, when the search has no export", () => {
    const reason = "Filtering needs the full match set on disk.";
    render(
      <LoganSearchCohort
        filtering={controlsOf({}, reason)}
        search={searchOf(RESULTS)}
        summary={IDLE_SUMMARY}
      />
    );

    expect(screen.queryByRole("button", { name: /^ILLUMINA/ })).toBe(null);
    expect(screen.getByText(reason)).toBeTruthy();
  });

  it("does not show the unfiltered cohort while the filtered one loads", () => {
    render(
      <LoganSearchCohort
        filtering={controlsOf({ platform: ["ILLUMINA"] })}
        search={searchOf(RESULTS)}
        summary={{ ...IDLE_SUMMARY, isLoading: true }}
      />
    );

    expect(screen.getByText(/Counting the runs that match/)).toBeTruthy();
    expect(screen.queryByText("E. coli")).toBe(null);
  });

  it("reads the filtered cohort once it lands", () => {
    render(
      <LoganSearchCohort
        filtering={controlsOf({ platform: ["ILLUMINA"] })}
        search={searchOf({ ...RESULTS, filtered: true, total_hits: 60 })}
        summary={{
          ...IDLE_SUMMARY,
          summary: summaryOf({ ...COHORT, in_mirror: 60, total: 60 }),
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /How the 60 runs matching these filters break down/,
      })
    ).toBeTruthy();
  });
});

describe("years and map as filters", () => {
  it("toggles a year", () => {
    const controls = controlsOf();
    render(<CohortYears facet={COHORT.facets[1]} filtering={controls} />);

    fireEvent.click(screen.getByRole("button", { name: /^2019: 40 runs/ }));

    expect(controls.onToggleYear).toHaveBeenCalledWith(2019);
  });

  it("outlines picked countries and toggles them on click", async () => {
    mockAddEventListener.mockClear();
    const controls = controlsOf({ country_iso: ["KEN"] });
    render(<CohortGeography filtering={controls} geography={GEOGRAPHY} />);

    await waitFor(() => expect(mockAddEventListener).toHaveBeenCalled());
    const [event, handler] = mockAddEventListener.mock.calls[0];
    expect(event).toBe("click");
    handler({}, { datum: { iso_a3: "KEN" } });
    handler({}, { datum: { id: "404" } });
    expect(controls.onToggle).toHaveBeenCalledTimes(1);
    expect(controls.onToggle).toHaveBeenCalledWith("country_iso", "KEN");

    const spec = JSON.stringify(
      buildSpec([{ ...GEOGRAPHY.countries[0], selected: true }], [], true)
    );
    expect(spec).toContain("datum.selected");
  });
});

/**
 * A summary state around a cohort.
 * @param cohort - The filtered cohort.
 * @returns The summary.
 */
function summaryOf(cohort: KmindexCohort): KmindexSummaryState["summary"] {
  return {
    cohort,
    geography: GEOGRAPHY,
    matched: cohort.total,
    total_matches: 100,
  };
}

/**
 * A filter hook stub.
 * @param filters - Current filter.
 * @returns The stub.
 */
function filteringOf(filters: Partial<LoganFilters>): UseLoganFilters {
  const full = { ...EMPTY_FILTERS, ...filters };
  return {
    clear: jest.fn(),
    filters: full,
    query: new URLSearchParams(
      Object.entries(filters).flatMap(([field, values]) =>
        Array.isArray(values) ? values.map((v) => [`f.${field}`, v]) : []
      )
    ).toString(),
    removeScore: jest.fn(),
    removeYear: jest.fn(),
    toggle: jest.fn(),
    toggleYear: jest.fn(),
  };
}

describe("LoganSearchFilterBar", () => {
  it("invites a filter when there is none", () => {
    render(
      <LoganSearchFilterBar
        disabledReason={null}
        filterError={null}
        filtering={filteringOf({})}
        results={RESULTS}
        summary={IDLE_SUMMARY}
      />
    );
    expect(screen.getByText(/Filter by clicking a value/)).toBeTruthy();
  });

  it("shows the chips, both counts and a filtered download", () => {
    const filtering = filteringOf({
      country_iso: ["KEN"],
      platform: ["ILLUMINA"],
    });
    render(
      <LoganSearchFilterBar
        disabledReason={null}
        filterError={null}
        filtering={filtering}
        results={{ ...RESULTS, filtered: true, total_hits: 12 }}
        summary={IDLE_SUMMARY}
      />
    );

    expect(
      screen.getByText("12 of 100 runs match these filters.")
    ).toBeTruthy();
    expect(screen.getByText("Country: Kenya")).toBeTruthy();
    const download = screen.getByRole("link", {
      name: /Download filtered runs/,
    });
    expect(download.getAttribute("href")).toContain(
      "/kmindex/jobs/job1/export?format=tsv&f.country_iso=KEN&f.platform=ILLUMINA"
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(filtering.clear).toHaveBeenCalled();
  });

  it("puts the refusal next to the chips, without a download", () => {
    render(
      <LoganSearchFilterBar
        disabledReason={null}
        filterError="Filtering needs the full match set on disk."
        filtering={filteringOf({ platform: ["ILLUMINA"] })}
        results={RESULTS}
        summary={IDLE_SUMMARY}
      />
    );

    expect(screen.getByText(/Filtering needs the full match set/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Download filtered runs/ })).toBe(
      null
    );
  });
});

describe("filtered table", () => {
  it("blames the filter, not the threshold, when nothing matches", () => {
    render(
      <LoganSearchResults
        search={searchOf({ ...RESULTS, filtered: true, total_hits: 0 })}
      />
    );

    expect(screen.getByText(/No runs match these filters/)).toBeTruthy();
    expect(screen.queryByText(/at this threshold/)).toBe(null);
  });
});
