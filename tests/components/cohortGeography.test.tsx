import { CohortGeography } from "@brc/components/LoganSearch/CohortGeography/cohortGeography";
import {
  type KmindexGeography,
  type KmindexGeographyCountry,
} from "@repo/shared/hooks/useKmindexSearch";
import { render, screen, waitFor } from "@testing-library/react";

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
    expect(spec.layer).toHaveLength(2);
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

    expect(embedMock()).not.toHaveBeenCalled();
    expect(
      screen.getByText(/not one matched run has a country recorded/)
    ).toBeTruthy();
  });

  it("explains itself when every recorded country is unplaceable", () => {
    render(<CohortGeography geography={geography({ countries: [] })} />);

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
