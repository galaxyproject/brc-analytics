import {
  CohortYears,
  yearBars,
} from "@brc/components/LoganSearch/CohortYears/cohortYears";
import { type KmindexFacet } from "@repo/shared/hooks/useKmindexSearch";
import { render, screen } from "@testing-library/react";

/**
 * Facet shorthand. Values are given count-descending, the order the API
 * actually sends them in, so nothing here can quietly depend on the payload
 * arriving in chronological order.
 * @param values - Listed values as [year, count] pairs.
 * @param other - Runs in years outside the listed values.
 * @param unknown - Runs with no release year at all.
 * @returns A release_year facet as the API sends it.
 */
function yearFacet(
  values: [string, number][],
  other = 0,
  unknown = 0
): KmindexFacet {
  return {
    name: "release_year",
    other,
    unknown,
    values: values.map(([value, count]) => ({ count, value })),
  };
}

/**
 * The rendered columns, in document order.
 * @returns One element per year in the range.
 */
function columns(): HTMLElement[] {
  return Array.from(screen.getByRole("img").children) as HTMLElement[];
}

/**
 * The year labels under the bars, in document order.
 * @returns One label per column, empty where the axis skips a year.
 */
function labels(): string[] {
  return columns().map((column) => column.lastElementChild?.textContent ?? "");
}

/**
 * The bars themselves, one per column. Each column is a band carrying the
 * baseline, the bar inside it, and the label under it.
 * @returns One bar per column, in document order.
 */
function bars(): HTMLElement[] {
  return columns().map(
    (column) => column.firstElementChild?.firstElementChild as HTMLElement
  );
}

/**
 * The inline heights the bars were given, in document order.
 * @returns One CSS height per column.
 */
function heights(): string[] {
  return bars().map((bar) => bar.style.height);
}

describe("yearBars", () => {
  test("fills a gap year rather than letting it disappear", () => {
    // A year with no runs is a finding about the corpus. Dropping it would
    // close the gap up and draw 2010 next to 2012 as if they were adjacent.
    expect(
      yearBars(
        yearFacet([
          ["2010", 100],
          ["2012", 40],
        ])
      )
    ).toEqual([
      { count: 100, year: 2010 },
      { count: 0, year: 2011 },
      { count: 40, year: 2012 },
    ]);
  });

  test("ignores a value that is not a year", () => {
    // The mirror's sentinels reach the facet as strings like anything else,
    // and a blank converts to the number 0 -- which as a year would stretch
    // the axis back two millennia.
    expect(
      yearBars(
        yearFacet([
          ["2010", 100],
          ["uncalculated", 7],
          ["", 3],
          ["202", 2],
          ["2011", 40],
        ])
      )
    ).toEqual([
      { count: 100, year: 2010 },
      { count: 40, year: 2011 },
    ]);
  });
});

describe("CohortYears", () => {
  test("draws one column per year, the tallest full height, labelled year by year", () => {
    render(
      <CohortYears
        facet={yearFacet([
          ["2021", 400],
          ["2019", 200],
          ["2018", 100],
          ["2022", 50],
        ])}
      />
    );

    // Five years, 2020 among them with nothing in it.
    expect(columns()).toHaveLength(5);
    expect(labels()).toEqual(["2018", "2019", "2020", "2021", "2022"]);
    expect(heights()).toEqual(["25%", "50%", "0%", "100%", "13%"]);
    // The count is on the column rather than on the page: fifteen numbers
    // under fifteen bars is not a shape anyone can read.
    expect(screen.getByTitle("2021: 400 runs")).toBeTruthy();
    expect(screen.getByTitle("2020: 0 runs")).toBeTruthy();
    // The range alone says nothing about the shape, so the label names the
    // peak too and the hidden list below carries the rest.
    expect(
      screen.getByRole("img", {
        name: "Runs released per year, 2018 to 2022; most in 2021, with 400",
      })
    ).toBeTruthy();
    expect(screen.getByText("750 runs")).toBeTruthy();
  });

  test("lists every year and its count for a screen reader", () => {
    render(
      <CohortYears
        facet={yearFacet([
          ["2021", 2992],
          ["2019", 200],
        ])}
      />
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.textContent)).toEqual([
      "2019: 200 runs",
      "2020: 0 runs",
      "2021: 2,992 runs",
    ]);
  });

  test("labels every fifth year once there are more than twelve", () => {
    render(
      <CohortYears
        facet={yearFacet([
          ["2022", 90],
          ["2010", 10],
        ])}
      />
    );

    expect(columns()).toHaveLength(13);
    // Every column is still drawn and still carries its count; only the axis
    // thins out, because thirteen four-digit labels do not fit the card.
    expect(labels()).toEqual([
      "2010",
      "",
      "",
      "",
      "",
      "2015",
      "",
      "",
      "",
      "",
      "2020",
      "",
      "",
    ]);
    expect(screen.getByTitle("2022: 90 runs")).toBeTruthy();
  });

  test("draws nothing for an empty year and a stub for a tiny one", () => {
    render(
      <CohortYears
        facet={yearFacet([
          ["2021", 402118],
          ["2019", 81],
        ])}
      />
    );

    // 81 beside 402,118 is under half a pixel, so the stub is what keeps it
    // on the axis; 2020 happened to nobody, and has to read as the gap it is.
    expect(heights()).toEqual(["0%", "0%", "100%"]);
    expect(bars().map((bar) => bar.style.minHeight)).toEqual([
      "1px",
      "0",
      "1px",
    ]);
  });

  test("says how many runs have no release date", () => {
    render(<CohortYears facet={yearFacet([["2020", 10]], 0, 5)} />);

    expect(screen.getByText("10 runs, 5 with no release date")).toBeTruthy();
  });

  test("says how many runs fell in years it did not list", () => {
    // A pre-Task-1 backend still caps the facet at its ten largest years, so
    // the tail has to be admitted rather than left out of the timeline.
    render(<CohortYears facet={yearFacet([["2020", 10]], 7, 0)} />);

    expect(screen.getByText("10 runs, 7 in years not listed")).toBeTruthy();
  });

  test("labels the last column when it stands clear of the previous label", () => {
    // Sixteen years: the last column is a labelled fifth already.
    const { unmount } = render(
      <CohortYears
        facet={yearFacet([
          ["2010", 10],
          ["2025", 90],
        ])}
      />
    );

    expect(labels().filter(Boolean)).toEqual(["2010", "2015", "2020", "2025"]);
    unmount();

    // Nineteen: the axis would otherwise stop at 2025 and leave the three
    // most recent years unnamed at the end of the row. Three columns is far
    // enough from the previous label for the two not to collide -- at two the
    // last column stays unlabelled, as the thirteen-year case above shows.
    render(
      <CohortYears
        facet={yearFacet([
          ["2010", 10],
          ["2028", 90],
        ])}
      />
    );

    expect(labels().filter(Boolean)).toEqual([
      "2010",
      "2015",
      "2020",
      "2025",
      "2028",
    ]);
  });

  test("draws a single-year facet as one full-height column", () => {
    render(<CohortYears facet={yearFacet([["2020", 42]])} />);

    expect(columns()).toHaveLength(1);
    expect(heights()).toEqual(["100%"]);
    expect(labels()).toEqual(["2020"]);
    expect(
      screen.getByRole("img", {
        name: "Runs released per year, 2020 to 2020; most in 2020, with 42",
      })
    ).toBeTruthy();
  });

  test("draws no bars at all when every year counted nothing", () => {
    render(
      <CohortYears
        facet={yearFacet([
          ["2020", 0],
          ["2021", 0],
        ])}
      />
    );

    // A facet of zeroes has no tallest year to measure the others against,
    // and no peak worth naming.
    expect(heights()).toEqual(["0%", "0%"]);
    expect(
      screen.getByRole("img", { name: "Runs released per year, 2020 to 2021" })
    ).toBeTruthy();
    expect(screen.getByText("0 runs")).toBeTruthy();
  });

  test("renders nothing for a facet with no years", () => {
    const { container } = render(<CohortYears facet={yearFacet([])} />);

    // Not an empty axis, not a heading over nothing.
    expect(container.innerHTML).toBe("");
  });
});
