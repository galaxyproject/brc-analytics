import { LOGAN_EXAMPLES } from "@brc/components/LoganSearch/LoganSearchForm/examples";
import { LoganSearchForm } from "@brc/components/LoganSearch/LoganSearchForm/loganSearchForm";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

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
 * The tooltip a chip shows, hovering the chip itself -- an unavailable value
 * is marked rather than disabled, so it still takes pointer events.
 * @param name - The row's label.
 * @param label - The chip's text.
 * @returns The tooltip text.
 */
async function tooltipOf(name: string, label: string): Promise<string> {
  fireEvent.mouseOver(chip(name, label));
  return (await screen.findByRole("tooltip")).textContent ?? "";
}

/**
 * The Search button, which the empty cases assert is closed.
 * @returns The button.
 */
function searchButton(): HTMLButtonElement {
  return screen.getByRole("button", {
    name: "Search Logan",
  }) as HTMLButtonElement;
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

  test("a value with nothing to pair with is marked, with the reason", async () => {
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

  test("an unavailable value keeps its place in the tab order", () => {
    renderForm();

    expect(chip("Organism", "Environmental").getAttribute("tabindex")).toBe(
      "0"
    );
  });

  test("clicking an unavailable value changes nothing", () => {
    renderForm();

    fireEvent.click(chip("Organism", "Environmental"));

    expect(screen.getByText(DEFAULT_SENTENCE)).toBeTruthy();
    expect(chip("Organism", "Environmental").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  test("says so when the two rows cross to nothing", () => {
    renderForm();

    // The only empty product is one that was reachable a click earlier: ENV
    // pairs with nothing genomic, but sits beside BCT under All until the
    // library row narrows and BCT is then taken away.
    fireEvent.click(chip("Library type", "All"));
    fireEvent.click(chip("Organism", "Bacteria"));
    fireEvent.click(chip("Organism", "Invertebrates"));
    fireEvent.click(chip("Organism", "Environmental"));
    fireEvent.click(chip("Library type", "Genomic"));
    fireEvent.click(chip("Organism", "Bacteria"));

    expect(screen.getByText("No index matches that combination.")).toBeTruthy();
    expect(searchButton().disabled).toBe(true);
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

    fireEvent.click(searchButton());

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({
      indexes: ["GENOMIC_INV"],
      sequence: expect.stringContaining("Plasmodium_falciparum_18S"),
      threshold: 0.5,
      zvalue: 6,
    });
  });

  test("hands an accepted search to the history list", async () => {
    const onSubmitted = jest.fn();
    const submit = jest.fn().mockResolvedValue("job123");
    render(
      <LoganSearchForm onSubmitted={onSubmitted} search={search({ submit })} />
    );

    fireEvent.click(searchButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(onSubmitted).toHaveBeenCalledWith({
      indexes: ["GENOMIC_INV"],
      jobId: "job123",
      queryName: "Plasmodium_falciparum_18S",
      submittedAt: expect.any(String),
      threshold: 0.5,
    });
  });

  test("records nothing when the submission fails", async () => {
    const onSubmitted = jest.fn();
    const submit = jest.fn().mockResolvedValue(null);
    render(
      <LoganSearchForm onSubmitted={onSubmitted} search={search({ submit })} />
    );

    fireEvent.click(searchButton());

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  test("Reset puts both rows back to the derived default", () => {
    const { reset } = renderForm();

    fireEvent.click(chip("Organism", "Bacteria"));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByText(DEFAULT_SENTENCE)).toBeTruthy();
  });

  test("falls back to the first index when the instance lacks the default", () => {
    renderForm({ indexes: VIRAL_ONLY });

    // Not All: resting on everything would make one click on an untouched
    // form the most expensive job the instance can run.
    expect(chip("Organism", "Viruses").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(chip("Library type", "Genomic").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(
      screen.getByText("Searching 1 of 9 indexes: GENOMIC_VRL.")
    ).toBeTruthy();
  });

  test("says so when the instance has no indexes at all", () => {
    renderForm({ indexes: [] });

    expect(
      screen.getByText("No indexes are available right now.")
    ).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Organism" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Library type" })).toBeNull();
  });

  test("will not submit an empty query", () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });

    expect(searchButton().disabled).toBe(true);
  });
});

describe("LoganSearchForm examples", () => {
  test("loads an example's sequence and the index it is meant for", () => {
    renderForm();

    fireEvent.click(chip("Examples", "M. tuberculosis rpoB"));

    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toMatch(
      /^>Mycobacterium_tuberculosis_rpoB NC_000962\.3:760822-761421\n/
    );
    expect(
      screen.getByText("600 bases. FASTA; headers are ignored.")
    ).toBeTruthy();
    expect(
      screen.getByText("Searching 1 of 109 indexes: GENOMIC_BCT.")
    ).toBeTruthy();
  });

  test("every example fits the query cap and names its source range", () => {
    for (const example of LOGAN_EXAMPLES) {
      const [header, ...lines] = example.sequence.split("\n");
      const bases = lines.join("").length;
      const range = header.match(/ ([A-Z_]+\d+\.\d+):(\d+)-(\d+)$/);
      expect(range).not.toBeNull();
      const [, , start, stop] = range as RegExpMatchArray;
      expect(bases).toBe(Number(stop) - Number(start) + 1);
      expect(bases).toBeLessThanOrEqual(2500);
      expect(lines.join("")).toMatch(/^[ACGT]+$/);
      expect(INDEXES).toContain(
        `${example.strategies[0]}_${example.divisions[0]}`
      );
    }
  });
});

describe("LoganSearchForm query file", () => {
  // jsdom's Blob predates text(), which every browser the site supports has;
  // FileReader is the jsdom route to the same string.
  beforeAll(() => {
    const proto = Blob.prototype as Partial<Pick<Blob, "text">>;
    if (proto.text) return;
    proto.text = function text(this: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (): void => resolve(String(reader.result));
        reader.onerror = (): void => reject(reader.error);
        reader.readAsText(this);
      });
    };
  });

  /**
   * The hidden file input behind the Load FASTA file button.
   * @returns The input.
   */
  function fileInput(): HTMLInputElement {
    const input =
      document.querySelector<HTMLInputElement>("input[type='file']");
    if (!input) throw new Error("no file input");
    return input;
  }

  /**
   * Pick a file in the hidden input.
   * @param file - The file the reader picked.
   */
  function pick(file: File): void {
    fireEvent.change(fileInput(), { target: { files: [file] } });
  }

  test("accepts the FASTA extensions and plain text", () => {
    renderForm();

    expect(screen.getByText("Load FASTA file").closest("label")).toBeTruthy();
    expect(fileInput().accept).toBe(".fa,.fasta,.fna,.txt");
  });

  test("reads the file into the query box", async () => {
    renderForm();
    pick(new File([">spike\nACGTACGTAC\nGTAC\n"], "spike.fa"));

    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    await screen.findByText("14 bases. FASTA; headers are ignored.");
    expect(box.value).toBe(">spike\nACGTACGTAC\nGTAC\n");
  });

  test("holds a loaded file to the same base cap as a pasted query", async () => {
    const { submit } = renderForm();
    pick(new File([`>long\n${"A".repeat(2501)}\n`], "long.fasta"));

    await screen.findByText(/2501 bases -- queries are capped at 2500/);
    expect(searchButton().disabled).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });

  test("refuses a file far too large to be one query, leaving the box alone", async () => {
    renderForm();
    const before = (screen.getByRole("textbox") as HTMLTextAreaElement).value;
    const genome = new File(["A"], "genome.fna");
    Object.defineProperty(genome, "size", { value: 50 * 1024 * 1024 });
    pick(genome);

    expect((await screen.findByRole("alert")).textContent).toMatch(
      /genome\.fna is too large/
    );
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      before
    );
  });
});

describe("LoganSearchForm presets", () => {
  test("offers Logan's groups and says why the others are missing", () => {
    renderForm();

    expect(
      within(row("Presets"))
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual([
      "All",
      "All but viral and human",
      "Transcriptomic",
      "Metatranscriptomic",
      "Metagenomic",
    ]);
    expect(screen.getByText(/Fast groups aren't here/)).toBeTruthy();
    expect(screen.getByText(/GenBank_RefSeq/)).toBeTruthy();
  });

  test("a preset sets the chip rows, which stay editable", () => {
    renderForm();

    fireEvent.click(chip("Presets", "Metagenomic"));
    expect(
      chip("Library type", "Metagenomic").getAttribute("aria-pressed")
    ).toBe("true");
    expect(chip("Organism", "All").getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(
        "Searching 13 of 109 indexes: every organism; metagenomic."
      )
    ).toBeTruthy();

    fireEvent.click(chip("Organism", "Bacteria"));
    expect(
      screen.getByText("Searching 1 of 109 indexes: METAGENOMIC_BCT.")
    ).toBeTruthy();
    // The rows no longer come to the preset, so it is no longer lit.
    expect(chip("Presets", "Metagenomic").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  test("submits what All but viral and human comes to", () => {
    const { submit } = renderForm();

    fireEvent.click(chip("Presets", "All but viral and human"));
    fireEvent.click(searchButton());

    const sent: string[] = submit.mock.calls[0][0].indexes;
    expect(sent).toHaveLength(82);
    expect(sent.some((index) => /_(VRL|PHG|HUMAN)$/.test(index))).toBe(false);
  });

  test("lights a preset reached by hand", () => {
    renderForm();

    fireEvent.click(chip("Organism", "All"));
    fireEvent.click(chip("Library type", "All"));

    expect(chip("Presets", "All").getAttribute("aria-pressed")).toBe("true");
    expect(chip("Presets", "Transcriptomic").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  test("names the logan-search.org group and its size on hover", async () => {
    renderForm();

    expect(await tooltipOf("Presets", "Transcriptomic")).toBe(
      "Transcriptomic on logan-search.org -- Bulk and single-cell " +
        "transcriptomic libraries. 24 indexes."
    );
  });
});
