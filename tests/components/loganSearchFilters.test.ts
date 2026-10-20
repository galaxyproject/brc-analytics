import {
  EMPTY_FILTERS,
  filterQuery,
  isEmptyFilters,
  type LoganFilters,
  parseFilters,
  toDuckdbWhere,
  toggleValue,
  toggleYear,
  yearSelected,
} from "@brc/components/LoganSearch/LoganSearchFilters/filters";
import { useLoganFilters } from "@brc/components/LoganSearch/LoganSearchFilters/useLoganFilters";
import { act, renderHook } from "@testing-library/react";

/**
 * A filter with some fields set.
 * @param fields - Fields to set.
 * @returns The filter.
 */
function filters(fields: Partial<LoganFilters>): LoganFilters {
  return { ...EMPTY_FILTERS, ...fields };
}

/**
 * Point the jsdom URL at the search page with a query string.
 * @param search - Query string, with its leading "?".
 */
function setUrl(search: string): void {
  window.history.replaceState(null, "", `/logan-search${search}`);
}

describe("URL encoding", () => {
  it("round-trips through the query string", () => {
    const original = filters({
      country: ["Kenya", "Malawi"],
      country_iso: ["PSE"],
      platform: ["__none__", "ILLUMINA"],
      score_min: 0.8,
      year: { max: 2020, min: 2015 },
    });
    expect(parseFilters(filterQuery(original))).toEqual(
      filters({
        // Sorted on the way out, so equal filters make equal links.
        country: ["Kenya", "Malawi"],
        country_iso: ["PSE"],
        platform: ["ILLUMINA", "__none__"],
        score_min: 0.8,
        year: { max: 2020, min: 2015 },
      })
    );
  });

  it("is empty for an empty filter, so the request carries nothing new", () => {
    expect(filterQuery(EMPTY_FILTERS)).toBe("");
    expect(isEmptyFilters(parseFilters("?job=abc&demo=true"))).toBe(true);
  });

  it("writes a single year without a range", () => {
    expect(filterQuery(filters({ year: { max: 2019, min: 2019 } }))).toBe(
      "f.year=2019"
    );
    expect(filterQuery(filters({ year: { max: null, min: 2018 } }))).toBe(
      "f.year=2018.."
    );
  });

  it("drops what it cannot read rather than refusing the link", () => {
    const parsed = parseFilters(
      "f.organism=x&f.year=soon&f.score=7&f.platform=&f.year=2020..2015"
    );
    expect(isEmptyFilters(parsed)).toBe(true);
  });

  it("does not repeat a value given twice", () => {
    expect(parseFilters("f.country=Kenya&f.country=Kenya").country).toEqual([
      "Kenya",
    ]);
  });
});

describe("toggles", () => {
  it("adds and removes a value", () => {
    const once = toggleValue(EMPTY_FILTERS, "platform", "ILLUMINA");
    expect(once.platform).toEqual(["ILLUMINA"]);
    expect(toggleValue(once, "platform", "ILLUMINA").platform).toEqual([]);
    // Never mutates what it was given.
    expect(EMPTY_FILTERS.platform).toEqual([]);
  });

  it("builds a year range by clicking its ends", () => {
    const first = toggleYear(EMPTY_FILTERS, 2015);
    expect(first.year).toEqual({ max: 2015, min: 2015 });
    const range = toggleYear(first, 2020);
    expect(range.year).toEqual({ max: 2020, min: 2015 });
    expect(yearSelected(range, 2017)).toBe(true);
    expect(yearSelected(range, 2021)).toBe(false);
    // Inside a range narrows to that year; the only year again clears.
    const narrowed = toggleYear(range, 2017);
    expect(narrowed.year).toEqual({ max: 2017, min: 2017 });
    expect(toggleYear(narrowed, 2017).year).toBeNull();
  });
});

describe("Copy as DuckDB WHERE", () => {
  it("matches the parquet's columns and quotes values", () => {
    expect(
      toDuckdbWhere(
        filters({
          assay_type: ["WGS"],
          country: ["Cote d'Ivoire", "Kenya"],
          platform: ["__none__"],
          score_min: 0.8,
          year: { max: 2020, min: 2015 },
        })
      )
    ).toBe(
      [
        "assay_type = 'WGS'",
        "AND country IN ('Cote d''Ivoire', 'Kenya')",
        "AND platform IS NULL",
        "AND year(release_date) BETWEEN 2015 AND 2020",
        "AND score >= 0.8",
      ].join("\n")
    );
  });

  it("names map picks in a comment instead of guessing raw values", () => {
    const where = toDuckdbWhere(filters({ country_iso: ["PSE"] }), {
      PSE: "Palestine",
    });
    expect(where.startsWith("TRUE\n-- ")).toBe(true);
    expect(where).toContain("(Palestine)");
  });
});

describe("useLoganFilters", () => {
  beforeEach(() => setUrl(""));

  it("ignores filters in the URL and never writes one while the flag is off", () => {
    setUrl("?job=abc&f.platform=ILLUMINA");
    const { result } = renderHook(() => useLoganFilters(false));

    expect(result.current.query).toBe("");
    expect(isEmptyFilters(result.current.filters)).toBe(true);
    act(() => result.current.toggle("country", "Kenya"));
    expect(window.location.search).toBe("?job=abc&f.platform=ILLUMINA");
    expect(result.current.query).toBe("");
  });

  it("reads the URL once the flag is on", () => {
    setUrl("?job=abc&f.platform=ILLUMINA");
    const { result } = renderHook(() => useLoganFilters(true));

    expect(result.current.filters.platform).toEqual(["ILLUMINA"]);
    expect(result.current.query).toBe("f.platform=ILLUMINA");
  });

  it("writes changes beside the job and leaves other params alone", () => {
    setUrl("?job=abc&logan-filters=true");
    const { result } = renderHook(() => useLoganFilters(true));

    act(() => result.current.toggle("country", "Kenya"));
    act(() => result.current.toggleYear(2019));

    const params = new URLSearchParams(window.location.search);
    expect(params.get("job")).toBe("abc");
    expect(params.get("logan-filters")).toBe("true");
    expect(params.getAll("f.country")).toEqual(["Kenya"]);
    expect(params.get("f.year")).toBe("2019");

    act(() => result.current.clear());
    expect(window.location.search).toBe("?job=abc&logan-filters=true");
  });
});
