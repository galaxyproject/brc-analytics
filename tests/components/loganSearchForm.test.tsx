import { LoganSearchForm } from "@brc/components/LoganSearch/LoganSearchForm/loganSearchForm";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { fireEvent, render, screen, within } from "@testing-library/react";

// The form renders the Galaxy link prompt, which reaches for the network on
// mount through ky -- ESM only, which Jest cannot parse. Mocking the module
// path instead is not an option here: next/jest resolves the @brc alias in the
// SWC transform, so it never reaches jest.mock's own resolver.
jest.mock("ky", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

type Search = ReturnType<typeof useKmindexSearch>;

// The registered list as dev returns it: every strategy across every division
// except ENV, which exists only as METAGENOMIC_ENV. 9 x 12 + 1 = 109.
const STRATEGY_CODES = [
  "GENOMIC",
  "GENOMICSINGLECELL",
  "METAGENOMIC",
  "METATRANSCRIPTOMIC",
  "OTHER",
  "SYNTHETIC",
  "TRANSCRIPTOMIC",
  "TRANSCRIPTOMICSINGLECELL",
  "VIRALRNA",
];

const DIVISION_CODES = [
  "BCT",
  "ENV",
  "HUMAN",
  "INV",
  "MAM",
  "MICE",
  "PHG",
  "PLN",
  "PRI",
  "ROD",
  "UNKNOWN",
  "VRL",
  "VRT",
];

const INDEXES = STRATEGY_CODES.flatMap((strategy) =>
  DIVISION_CODES.filter(
    (division) => division !== "ENV" || strategy === "METAGENOMIC"
  ).map((division) => `${strategy}_${division}`)
);

const VIRAL_ONLY = INDEXES.filter((index) => index.endsWith("_VRL"));

const DEFAULT_SENTENCE = "Searching 1 of 109 indexes: GENOMIC_INV.";

/**
 * A search-hook stub carrying only what the form reads.
 * @param overrides - Fields to set on top of an idle search with the full
 * index list loaded.
 * @returns The stubbed hook return.
 */
function search(overrides: Record<string, unknown> = {}): Search {
  return {
    error: null,
    goToPage: jest.fn(),
    indexes: INDEXES,
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
 * Render the form with its two callbacks captured.
 * @param overrides - Fields to set on the search stub.
 * @returns The two mocks the cases assert against.
 */
function renderForm(overrides: Record<string, unknown> = {}): {
  reset: jest.Mock;
  submit: jest.Mock;
} {
  const reset = jest.fn();
  const submit = jest.fn();
  render(<LoganSearchForm search={search({ reset, submit, ...overrides })} />);
  return { reset, submit };
}

/**
 * One of the two chip rows.
 * @param name - The row's label, which names its group.
 * @returns The group element.
 */
function row(name: string): HTMLElement {
  return screen.getByRole("group", { name });
}

/**
 * A chip in a row.
 * @param name - The row's label.
 * @param label - The chip's text.
 * @returns The chip, which is the element carrying the button role.
 */
function chip(name: string, label: string): HTMLElement {
  return within(row(name)).getByRole("button", { name: label });
}

/**
 * The tooltip a chip shows, hovering the span that wraps it -- a disabled
 * chip fires no pointer events of its own.
 * @param name - The row's label.
 * @param label - The chip's text.
 * @returns The tooltip text.
 */
async function tooltipOf(name: string, label: string): Promise<string> {
  fireEvent.mouseOver(chip(name, label).parentElement as HTMLElement);
  return (await screen.findByRole("tooltip")).textContent ?? "";
}

describe("LoganSearchForm index picker", () => {
  test("offers All plus every registered value on each row", () => {
    renderForm();

    expect(within(row("Organism")).getAllByRole("button")).toHaveLength(14);
    expect(within(row("Library type")).getAllByRole("button")).toHaveLength(10);
    expect(
      within(row("Organism"))
        .getAllByRole("button")
        .slice(0, 4)
        .map((button) => button.textContent)
    ).toEqual(["All", "Bacteria", "Viruses", "Phage"]);
  });

  test("starts on the pair the sample query was written for", () => {
    renderForm();

    expect(chip("Organism", "Invertebrates").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(chip("Library type", "Genomic").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(chip("Organism", "All").getAttribute("aria-pressed")).toBe("false");
    expect(chip("Library type", "All").getAttribute("aria-pressed")).toBe(
      "false"
    );
    expect(screen.getByText(DEFAULT_SENTENCE)).toBeTruthy();
  });

  test("adding an organism adds its index", () => {
    renderForm();

    fireEvent.click(chip("Organism", "Bacteria"));

    expect(
      screen.getByText("Searching 2 of 109 indexes: GENOMIC_BCT, GENOMIC_INV.")
    ).toBeTruthy();
  });

  test("All on one row lifts that row's constraint", () => {
    renderForm();

    fireEvent.click(chip("Organism", "Bacteria"));
    fireEvent.click(chip("Library type", "All"));

    expect(
      screen.getByText(
        "Searching 18 of 109 indexes: bacteria and invertebrates; every library type."
      )
    ).toBeTruthy();
  });

  test("All on both rows is the whole registry", () => {
    renderForm();

    fireEvent.click(chip("Library type", "All"));
    fireEvent.click(chip("Organism", "All"));

    expect(screen.getByText("Searching all 109 indexes.")).toBeTruthy();
  });

  test("a value with nothing to pair with is disabled, with the reason", async () => {
    renderForm();

    expect(
      chip("Organism", "Environmental").getAttribute("aria-disabled")
    ).toBe("true");
    expect(await tooltipOf("Organism", "Environmental")).toBe(
      "ENV -- no index pairs it with the selected library types."
    );

    fireEvent.click(chip("Library type", "All"));

    expect(
      chip("Organism", "Environmental").getAttribute("aria-disabled")
    ).toBeNull();
  });

  test("an enabled chip names its code, its count and its caveat", async () => {
    renderForm();

    expect(await tooltipOf("Organism", "Invertebrates")).toBe(
      "INV -- 9 indexes. GenBank's invertebrate division, which also holds " +
        "protists such as Plasmodium."
    );
  });

  test("submits the product the chips describe", () => {
    const { submit } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Search Logan" }));

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      indexes: ["GENOMIC_INV"],
      sequence: expect.stringContaining("Plasmodium_falciparum_18S"),
      threshold: 0.5,
      zvalue: 6,
    });
  });

  test("Reset puts both rows back to the derived default", () => {
    const { reset } = renderForm();

    fireEvent.click(chip("Organism", "Bacteria"));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByText(DEFAULT_SENTENCE)).toBeTruthy();
  });

  test("rests on All when the instance lacks the default index", () => {
    renderForm({ indexes: VIRAL_ONLY });

    expect(chip("Organism", "All").getAttribute("aria-pressed")).toBe("true");
    expect(chip("Library type", "All").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByText("Searching all 9 indexes.")).toBeTruthy();
  });

  test("says so when the instance has no indexes at all", () => {
    renderForm({ indexes: [] });

    expect(
      screen.getByText("No indexes are available right now.")
    ).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
  });

  test("will not submit an empty query", () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });

    expect(
      (
        screen.getByRole("button", {
          name: "Search Logan",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
