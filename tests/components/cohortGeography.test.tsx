import { CohortGeography } from "@brc/components/LoganSearch/CohortGeography/cohortGeography";
import {
  type KmindexGeography,
  type KmindexGeographyCountry,
  type KmindexGeographyLocation,
} from "@repo/shared/hooks/useKmindexSearch";
import { act, render, screen, waitFor } from "@testing-library/react";

// The hook module this component takes its types from imports ky, which ships
// ESM only and Jest cannot parse.
jest.mock("ky", () => ({ __esModule: true, default: {} }));

// vega-embed is imported dynamically inside the effect. Stubbing it keeps the
// test about the spec we hand over and the prose around it, which is what can
// actually be wrong -- jsdom cannot render an SVG projection anyway.
jest.mock("vega-embed", () => ({
  __esModule: true,
  default: jest.fn(async () => ({ finalize: jest.fn() })),
}));

/**
 * The stubbed vega-embed function.
 * @returns The mock, typed for assertions.
 */
function embedMock(): jest.Mock {
  // Required rather than imported at the top so the factory above has already
  // run; naming a jest.fn() directly in the factory hits the TDZ.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
  return require("vega-embed").default as jest.Mock;
}

// The reference P. falciparum job: a 500 bp 18S fragment against GENOMIC_INV
// at threshold 0.5, 17,629 matches, 42 countries. Country is unrecorded for
// 80.8% of it, which is the number this whole block exists to stop the card
// from burying. Real values, per the convention in loganSearchCohort.test.tsx.
const IN_MIRROR = 17629;
const RECORDED = 3387;
const UNKNOWN = IN_MIRROR - RECORDED;

/**
 * A drawable country row as the API sends it.
 * @param value - Canonical country name.
 * @param isoA3 - ISO 3166-1 alpha-3.
 * @param isoN3 - ISO 3166-1 numeric, which is what the topology joins on.
 * @param count - Matched runs.
 * @returns The row.
 */
function country(
  value: string,
  isoA3: string,
  isoN3: string,
  count: number
): KmindexGeographyCountry {
  return { count, iso_a3: isoA3, iso_n3: isoN3, value };
}

const COUNTRIES = [
  country("Malawi", "MWI", "454", 1204),
  country("Ghana", "GHA", "288", 902),
  country("Kenya", "KEN", "404", 611),
  country("Thailand", "THA", "764", 402),
];

// Positions measured in the v5 mirror, each here for a reason the data gave
// it. -16.040532/34.797692 is SRR7590703 in Malawi, the one accession this
// feature has an end-to-end control for. 40.4406 N 79.9959 W is Pittsburgh,
// which carries 14,688 runs across 147 organisms mirror-wide: an
// institutional address typed into the sample attribute, and the residual no
// filter fixes -- it is deliberately the largest point here. 0/0 is null
// island, 254 runs mirror-wide, kept because nothing in the row distinguishes
// a placeholder from a real position in the Gulf of Guinea.
const LOCATIONS: KmindexGeographyLocation[] = [
  { avg_score: 0.83, lat: 40.4406, lon: -79.9959, n: 41 },
  { avg_score: 0.71, lat: -16.040532, lon: 34.797692, n: 12 },
  { avg_score: 0.66, lat: 0, lon: 0, n: 2 },
];
const LOCATED = 55;

/**
 * Geography as the API sends it, with the parts reconciling the way the real
 * query guarantees: drawn + unplaceable + unknown == in_mirror.
 * @param overrides - Fields to replace.
 * @returns The geography payload.
 */
function geography(
  overrides: Partial<KmindexGeography> = {}
): KmindexGeography {
  const drawn = COUNTRIES.reduce((total, { count }) => total + count, 0);
  return {
    countries: COUNTRIES,
    in_mirror: IN_MIRROR,
    located: LOCATED,
    locations: LOCATIONS,
    locations_precision: null,
    locations_total: LOCATIONS.length,
    locations_truncated: 0,
    recorded: RECORDED,
    unknown: UNKNOWN,
    unmapped_countries: [
      { count: RECORDED - drawn - 61, value: "Hong Kong" },
      { count: 47, value: "Singapore" },
      { count: 9, value: "Borneo" },
      { count: 5, value: "Gibraltar" },
    ],
    ...overrides,
  };
}

/**
 * Geography from a mirror that predates the coordinate columns.
 *
 * The deployed schema_version 3 file, which is what the backend runs against
 * until somebody copies 10 GB onto the host. The country map still draws.
 * @param overrides - Fields to replace.
 * @returns The geography payload with every location field null.
 */
function withoutCoordinates(
  overrides: Partial<KmindexGeography> = {}
): KmindexGeography {
  return geography({
    located: null,
    locations: null,
    locations_precision: null,
    locations_total: null,
    locations_truncated: null,
    ...overrides,
  });
}

describe("the recorded/unknown split", () => {
  it("states both halves with the denominator, not just the map's share", async () => {
    render(<CohortGeography geography={geography()} />);

    const line = (await screen.findByText(/Geography recorded for/))
      .textContent;
    expect(line).toContain("3,387 of 17,629 runs (19.2%)");
    // The complement is named rather than left to subtraction. A cohort where
    // four fifths of the runs have no country is the normal case here.
    expect(line).toContain("14,242 matched the query with no country");
  });

  it("says so plainly when nothing at all was recorded", () => {
    render(
      <CohortGeography
        geography={geography({
          countries: [],
          recorded: 0,
          unknown: IN_MIRROR,
          unmapped_countries: [],
        })}
      />
    );

    expect(
      screen.getByText(/No country is recorded for any of the 17,629/)
    ).toBeTruthy();
  });
});

describe("countries the map cannot place", () => {
  it("reports them as a count and names the largest", async () => {
    render(<CohortGeography geography={geography()} />);

    const note = (await screen.findByText(/places the map cannot colour/))
      .textContent;
    // 4 places, 268 runs -- counted in `recorded` above and drawn nowhere.
    expect(note).toContain("268 of those runs come from 4 places");
    expect(note).toContain("Hong Kong (207)");
    expect(note).toContain("Singapore (47)");
    expect(note).toContain("and 1 more");
  });

  it("keeps quiet when everything recorded could be placed", () => {
    render(
      <CohortGeography geography={geography({ unmapped_countries: [] })} />
    );

    expect(screen.queryByText(/places the map cannot colour/)).toBeNull();
  });

  it("does not silently drop them from the reconciliation", () => {
    // The invariant the card leans on. If this stops holding, the shares on
    // screen stop meaning anything.
    const payload = geography();
    const drawn = payload.countries.reduce((n, c) => n + c.count, 0);
    const unplaceable = payload.unmapped_countries.reduce(
      (n, c) => n + c.count,
      0
    );
    expect(drawn + unplaceable + payload.unknown).toBe(payload.in_mirror);
    expect(drawn + unplaceable).toBe(payload.recorded);
  });
});

describe("the map", () => {
  beforeEach(() => {
    embedMock().mockClear();
  });

  it("joins the topology on the numeric id, not the alpha-3 code", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    const [, choropleth] = spec.layer;
    const [lookup] = choropleth.transform;
    // The trap: world-110m keys features by ISO numeric. A lookup on iso_a3
    // matches nothing and draws a blank world without erroring.
    expect(lookup.lookup).toBe("id");
    expect(lookup.from.key).toBe("iso_n3");
    expect(lookup.from.data.values).toEqual(COUNTRIES);
  });

  it("draws every country flat underneath so the world is still a world", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    // A single layer with a quantitative colour encoding compiles to a vega
    // filter on isValid(count), which drops every unmatched feature.
    expect(spec.layer).toHaveLength(3);
    expect(spec.layer[0].transform).toBeUndefined();
    expect(spec.layer[0].mark.fill).toBeTruthy();
  });

  it("reads the boundary geometry from the committed asset", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    expect(spec.data.url).toBe("/geo/countries-110m.json");
    expect(spec.data.format).toEqual({
      feature: "countries",
      type: "topojson",
    });
  });

  it("scales colour logarithmically", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    // USA carries 9.2M runs mirror-wide against a few hundred for Malawi; on
    // a linear ramp everything but the top one or two is the same pale blue.
    expect(spec.layer[1].encoding.color.scale.type).toBe("log");
  });

  it("is not drawn at all when there is nothing to colour", () => {
    // No country the outline can place and no position either. One point on
    // its own is enough to earn a map, so both halves have to be empty.
    render(
      <CohortGeography
        geography={withoutCoordinates({
          countries: [],
          recorded: 0,
          unknown: IN_MIRROR,
          unmapped_countries: [],
        })}
      />
    );

    expect(embedMock()).not.toHaveBeenCalled();
    expect(
      screen.getByText(/not one matched run has a country recorded/)
    ).toBeTruthy();
  });

  it("explains itself when every recorded country is unplaceable", () => {
    render(
      <CohortGeography geography={withoutCoordinates({ countries: [] })} />
    );

    expect(embedMock()).not.toHaveBeenCalled();
    expect(
      screen.getByText(/none of the recorded countries can be placed/)
    ).toBeTruthy();
  });

  it("finalizes the view on unmount, which vega-embed leaks without", async () => {
    const finalize = jest.fn();
    embedMock().mockResolvedValueOnce({ finalize });
    const { unmount } = render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    unmount();

    expect(finalize).toHaveBeenCalled();
  });

  it("says the map failed rather than leaving an empty box", async () => {
    embedMock().mockRejectedValueOnce(new Error("no geometry"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<CohortGeography geography={geography()} />);

    expect(await screen.findByText(/The map could not be drawn/)).toBeTruthy();
    // The counts beside it are computed server-side and are unaffected.
    expect(screen.getByText(/Geography recorded for/)).toBeTruthy();
  });
});

describe("the point layer", () => {
  beforeEach(() => {
    embedMock().mockClear();
  });

  /**
   * The circle layer out of the last spec handed to vega-embed.
   * @returns The layer.
   */
  function pointLayer(): {
    data: { values: Record<string, unknown>[] };
    encoding: Record<string, { field: string; scale?: { type?: string } }>;
    mark: { type: string };
  } {
    const [, spec] = embedMock().mock.calls[0];
    return spec.layer[spec.layer.length - 1];
  }

  it("draws sampling positions over the choropleth, not under it", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    // Last layer wins the paint order. A station inside a coloured country
    // would otherwise be hidden by the country it sits in.
    expect(spec.layer[spec.layer.length - 1].mark.type).toBe("circle");
    expect(pointLayer().data.values).toHaveLength(LOCATIONS.length);
  });

  it("sizes by run count and colours by mean score", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const { encoding } = pointLayer();
    // kmviz's HitsPerLocation preset, computed over the whole match set
    // instead of joined back onto every result row.
    expect(encoding.size.field).toBe("n");
    expect(encoding.color.field).toBe("avg_score");
    // sqrt, because one institutional coordinate can carry tens of thousands
    // of runs against a real station's one, and a linear area scale would
    // render every station as the same dot.
    expect(encoding.size.scale?.type).toBe("sqrt");
  });

  it("has no layer at all when the cohort recorded no position", async () => {
    render(
      <CohortGeography
        geography={geography({
          located: 0,
          locations: [],
          locations_total: 0,
        })}
      />
    );

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    // Not an empty circle layer: that still puts a size and a colour legend
    // on the chart, advertising an encoding that describes nothing.
    expect(spec.layer).toHaveLength(2);
  });

  it("has no layer on a mirror that has no coordinates to give", async () => {
    render(<CohortGeography geography={withoutCoordinates()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    expect(spec.layer).toHaveLength(2);
  });

  it("switches to canvas once there are points to draw", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    // The cap allows 20,000 circles, and 20,000 SVG nodes is the 31-36
    // second paint kmviz pays at this scale.
    expect(embedMock().mock.calls[0][2].renderer).toBe("canvas");
  });

  it("keeps SVG when the map is only countries", async () => {
    render(<CohortGeography geography={withoutCoordinates()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    expect(embedMock().mock.calls[0][2].renderer).toBe("svg");
  });

  it("is not redrawn when the payload has not actually changed", async () => {
    const payload = geography();
    const { rerender } = render(<CohortGeography geography={payload} />);
    await waitFor(() => expect(embedMock()).toHaveBeenCalledTimes(1));

    // A fresh props object carrying the same data. The card above this one
    // re-renders on every paging click, and tearing the view down and
    // re-embedding up to 20,000 points each time is not free.
    rerender(<CohortGeography geography={{ ...payload }} />);
    await act(async () => undefined);

    expect(embedMock()).toHaveBeenCalledTimes(1);
  });
});

describe("what a point says on hover", () => {
  beforeEach(() => {
    embedMock().mockClear();
  });

  it("names a place and a count, never an accession", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    const fields = spec.layer[spec.layer.length - 1].encoding.tooltip.map(
      (entry: { field: string }) => entry.field
    );
    // A point is N runs aggregated, so kmviz's "hover shows the ID" does not
    // transfer -- there is no single accession to name.
    expect(fields).toEqual(["position", "n", "avg_score"]);
  });

  it("writes the coordinate with hemispheres rather than signs", async () => {
    render(<CohortGeography geography={geography()} />);

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    const points = spec.layer[spec.layer.length - 1].data.values;
    // SRR7590703 in Malawi, the end-to-end control.
    expect(points[1].position).toBe("16.040532° S, 34.797692° E");
    expect(points[0].position).toBe("40.4406° N, 79.9959° W");
  });

  it("shows the coordinate at the precision it was collapsed to", async () => {
    render(
      <CohortGeography geography={geography({ locations_precision: 1 })} />
    );

    await waitFor(() => expect(embedMock()).toHaveBeenCalled());
    const [, spec] = embedMock().mock.calls[0];
    const points = spec.layer[spec.layer.length - 1].data.values;
    // Printing six decimals for a point merged at one would claim a
    // resolution the payload does not have, in the one place a reader goes
    // looking for it.
    expect(points[1].position).toBe("16.0° S, 34.8° E");
  });

  it("says out loud that a point is many runs and may be a laboratory", () => {
    render(<CohortGeography geography={geography()} />);

    expect(
      screen.getByText(/Each point is every matched run recorded/)
    ).toBeTruthy();
    // The residual no filter fixes: Pittsburgh carries 14,688 runs across 147
    // organisms mirror-wide and size-by-n draws it as one of the largest
    // markers. Saying so is the whole mitigation.
    expect(
      screen.getByText(/institutional addresses typed into the sample/)
    ).toBeTruthy();
  });
});

describe("what the positions cost to draw", () => {
  it("states its own denominator, not a share of the country line", async () => {
    render(<CohortGeography geography={geography()} />);

    const line = (await screen.findByText(/Sampling positions recorded for/))
      .textContent;
    // Out of in_mirror, not out of `recorded`: a run can carry a country and
    // a position, a country and none, or a position with no country.
    expect(line).toContain("55 of 17,629 runs (0.3%)");
    expect(line).toContain("at 3 places");
  });

  it("discloses rounding, and says it kept every run", async () => {
    // marine metagenome: 22,316 distinct positions over 199,029 runs, which
    // is over the 20,000 cap, so the backend steps down one rung to 3dp and
    // 19,838 places -- about 110 m, and nothing dropped.
    render(
      <CohortGeography
        geography={geography({
          in_mirror: 303777,
          located: 199029,
          locations_precision: 3,
          locations_total: 19838,
          locations_truncated: 0,
        })}
      />
    );

    const line = (await screen.findByText(/Sampling positions recorded for/))
      .textContent;
    expect(line).toContain("199,029 of 303,777 runs");
    expect(line).toContain("at 19,838 places");
    expect(line).toContain("rounded to 3 decimal places (about 110 m)");
    expect(line).toContain("every run is still counted");
    expect(line).not.toContain("shown nowhere");
  });

  it("discloses truncation separately, because it loses runs", async () => {
    // soil metagenome: 148,766 distinct positions over 1,035,815 runs. Even
    // at the bottom rung -- 1dp, ~11 km -- it is 34,310 places, so 14,310 of
    // them and the 28,277 runs at them are drawn nowhere. Measured.
    render(
      <CohortGeography
        geography={geography({
          in_mirror: 1524029,
          located: 1035815,
          locations: LOCATIONS,
          locations_precision: 1,
          locations_total: 34310,
          locations_truncated: 28277,
        })}
      />
    );

    const line = (await screen.findByText(/Sampling positions recorded for/))
      .textContent;
    expect(line).toContain("rounded to 1 decimal place (about 11 km)");
    expect(line).toContain("28,277 runs at the other 34,307");
    expect(line).toContain("counted here and shown nowhere on the map");
  });

  it("says plainly when the cohort recorded no position at all", async () => {
    render(
      <CohortGeography
        geography={geography({
          located: 0,
          locations: [],
          locations_total: 0,
        })}
      />
    );

    expect(
      await screen.findByText(/No matched run records a sampling position/)
    ).toBeTruthy();
  });

  it("says nothing about positions when the mirror has none to give", () => {
    // A statement about the file on the host, not about the cohort -- and the
    // country map above it is unaffected, so it goes unmentioned rather than
    // reported as an absence in the data.
    render(<CohortGeography geography={withoutCoordinates()} />);

    expect(screen.queryByText(/Sampling positions recorded/)).toBeNull();
    expect(screen.queryByText(/No matched run records a sampling/)).toBeNull();
    expect(screen.getByText(/Geography recorded for/)).toBeTruthy();
  });
});

describe("an absent payload", () => {
  it("renders nothing rather than an empty world", () => {
    const { container } = render(<CohortGeography geography={null} />);

    // Absent means the backend could not answer -- an unconfigured mirror, or
    // one that predates the columns. That is a fact about our deployment, not
    // about the cohort, so the card says nothing rather than something false.
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText(/Where these runs came from/)).toBeNull();
  });

  it("renders nothing when the field is simply missing", () => {
    const { container } = render(<CohortGeography />);

    expect(container.innerHTML).toBe("");
  });
});
