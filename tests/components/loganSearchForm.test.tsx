import { LOGAN_EXAMPLES } from "@repo/shared/components/LoganSearch/LoganSearchForm/examples";
import { LoganSearchForm } from "@repo/shared/components/LoganSearch/LoganSearchForm/loganSearchForm";
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
 * A labelled group of buttons: the scope cards or the examples.
 * @param name - The group's accessible name.
 * @returns The group element.
 */
function group(name: string): HTMLElement {
  return screen.getByRole("group", { name });
}

/**
 * A chip in a labelled group.
 * @param name - The group's name.
 * @param label - The chip's text.
 * @returns The chip, which is the element carrying the button role.
 */
function chip(name: string, label: string): HTMLElement {
  return within(group(name)).getByRole("button", { name: label });
}

/**
 * A scope card, found by its title. A card's accessible name is all of its
 * text, so the title is matched at the start.
 * @param title - The card's title.
 * @returns The card.
 */
function card(title: string): HTMLElement {
  return within(group("Index scope")).getByRole("button", {
    // The title, then the note, which starts with a capital: so "All" doesn't
    // also find "All but viral and human".
    name: new RegExp(`^${title} [A-Z]`),
  });
}

/**
 * Open the matrix behind the Custom card.
 * @returns The grid.
 */
function openMatrix(): HTMLElement {
  fireEvent.click(card("Custom"));
  return screen.getByRole("grid");
}

/**
 * One matrix cell.
 * @param library - The library type's label.
 * @param organism - The organism group's label.
 * @returns The cell's button.
 */
function cell(library: string, organism: string): HTMLElement {
  return screen.getByRole("button", { name: `${library}, ${organism}` });
}

/**
 * A row or column label on the matrix.
 * @param label - The organism group's or library type's label.
 * @returns The label's button.
 */
function line(label: string): HTMLElement {
  return screen.getByRole("button", {
    name: new RegExp(`^${label}, \\d+ index`),
  });
}

/**
 * The sentence beside the Search button.
 * @returns Its text.
 */
function sentence(): string {
  return screen.getByText(/^(Searching|Pick at least)/).textContent ?? "";
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
  test("offers a card per Logan group, then Custom", () => {
    renderForm();

    const titles = [
      "All",
      "All but viral and human",
      "Transcriptomic",
      "Metatranscriptomic",
      "Metagenomic",
      "Custom",
    ];
    expect(within(group("Index scope")).getAllByRole("button")).toEqual(
      titles.map(card)
    );
    expect(card("All but viral and human").textContent).toContain("82 indexes");
  });

  test("starts on the index the sample query was written for", () => {
    renderForm();

    expect(sentence()).toBe(DEFAULT_SENTENCE);
    expect(card("Custom").getAttribute("data-current")).toBe("true");
    expect(card("All").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("of 109 indexes")).toBeTruthy();
  });

  test("says why the default is what it is until something is picked", () => {
    renderForm();
    const why = /where the sample query's hits are/;

    expect(card("Custom").textContent).toMatch(why);
    fireEvent.click(card("Metagenomic"));
    expect(card("Custom").textContent).not.toMatch(why);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(card("Custom").textContent).toMatch(why);
  });

  test("a card selects its scope and lights up", () => {
    const { submit } = renderForm();

    fireEvent.click(card("All but viral and human"));
    fireEvent.click(searchButton());

    expect(card("All but viral and human").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(card("Custom").getAttribute("data-current")).toBe("false");
    const sent: string[] = submit.mock.calls[0][0].indexes;
    expect(sent).toHaveLength(82);
    expect(sent.some((index) => /_(VRL|PHG|HUMAN)$/.test(index))).toBe(false);
  });

  test("names the logan-search.org group on each card", () => {
    renderForm();

    expect(card("All but viral and human").textContent).toContain(
      "logan-search.org:All_No_viral_human"
    );
    expect(card("Custom").textContent).not.toContain("logan-search.org");
  });

  test("says why some logan-search.org groups are missing", async () => {
    renderForm();

    fireEvent.mouseOver(
      screen.getByLabelText("Why some logan-search.org groups are missing")
    );

    const tip = (await screen.findByRole("tooltip")).textContent;
    expect(tip).toMatch(/Fast groups aren't here/);
    expect(tip).toMatch(/GenBank_RefSeq/);
  });

  test("keeps the matrix closed until Custom opens it", () => {
    renderForm();

    expect(screen.queryByRole("grid")).toBeNull();
    expect(card("Custom").getAttribute("aria-expanded")).toBe("false");

    openMatrix();
    expect(card("Custom").getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(card("Custom"));
    expect(screen.queryByRole("grid")).toBeNull();
  });

  test("a cell adds or drops its index", () => {
    renderForm();
    openMatrix();

    fireEvent.click(cell("Genomic", "Bacteria"));
    expect(cell("Genomic", "Bacteria").getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(sentence()).toBe(
      "Searching 2 of 109 indexes: GENOMIC_BCT, GENOMIC_INV."
    );

    fireEvent.click(cell("Genomic", "Invertebrates"));
    expect(sentence()).toBe("Searching 1 of 109 indexes: GENOMIC_BCT.");
  });

  test("a row label takes the whole row, then drops it", () => {
    renderForm();
    openMatrix();

    fireEvent.click(line("Bacteria"));
    expect(sentence()).toBe(
      "Searching 10 of 109 indexes: a custom set across 9 library types and 2 organism groups."
    );
    expect(line("Bacteria").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(line("Bacteria"));
    expect(sentence()).toBe(DEFAULT_SENTENCE);
  });

  test("a column label that matches a card lights the card", () => {
    renderForm();
    openMatrix();

    fireEvent.click(cell("Genomic", "Invertebrates"));
    fireEvent.click(line("Metagenomic"));

    expect(card("Metagenomic").getAttribute("aria-pressed")).toBe("true");
    expect(card("Custom").getAttribute("data-current")).toBe("false");
  });

  test("the corner All takes everything, and clearing it closes Search", () => {
    renderForm();
    openMatrix();

    fireEvent.click(within(screen.getByRole("grid")).getByText("All"));
    expect(sentence()).toBe("Searching all 109 indexes.");
    expect(card("All").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(within(screen.getByRole("grid")).getByText("All"));
    expect(sentence()).toBe("Pick at least one index to search.");
    expect(searchButton().disabled).toBe(true);
  });

  test("a drag paints every cell it crosses the way the first one went", () => {
    renderForm();
    openMatrix();

    fireEvent.pointerDown(cell("Genomic", "Human"), { button: 0 });
    fireEvent.pointerEnter(cell("Metagenomic", "Human"));
    fireEvent.pointerEnter(cell("Transcriptomic", "Human"));
    fireEvent.pointerUp(window);
    // Released: passing over a cell no longer paints it.
    fireEvent.pointerEnter(cell("Synthetic", "Human"));

    expect(sentence()).toBe(
      "Searching 4 of 109 indexes: GENOMIC_HUMAN, GENOMIC_INV, METAGENOMIC_HUMAN, TRANSCRIPTOMIC_HUMAN."
    );
  });

  test("shows a hole in the grid as a hole, not a cell", () => {
    renderForm();
    openMatrix();

    expect(
      screen.queryByRole("button", { name: "Genomic, Environmental" })
    ).toBeNull();
    expect(
      screen.getByTitle("No genomic index for environmental")
    ).toBeTruthy();
    expect(cell("Metagenomic", "Environmental")).toBeTruthy();
  });

  test("is one tab stop, moved by the arrow keys past holes", () => {
    renderForm();
    const grid = openMatrix();

    const stops = within(grid)
      .getAllByRole("button")
      .filter((button) => button.getAttribute("tabindex") === "0");
    expect(stops).toEqual([cell("Genomic", "Invertebrates")]);

    cell("Genomic", "Human").focus();
    fireEvent.keyDown(cell("Genomic", "Human"), { key: "ArrowDown" });
    // Genomic has no environmental index, so the step lands a row further.
    expect(document.activeElement).toBe(cell("Genomic", "Unclassified"));

    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(line("Unclassified"));
  });

  test("hands an accepted search to the history list", async () => {
    const onSubmitted = jest.fn();
    const submit = jest.fn().mockResolvedValue("job123");
    render(
      <LoganSearchForm onSubmitted={onSubmitted} search={search({ submit })} />
    );

    fireEvent.click(searchButton());

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith({
      indexes: ["GENOMIC_INV"],
      sequence: expect.stringContaining("Plasmodium_falciparum_18S"),
      threshold: 0.5,
      zvalue: 6,
    });
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

  test("Reset puts the selection back to the derived default", () => {
    const { reset } = renderForm();

    fireEvent.click(card("All"));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(sentence()).toBe(DEFAULT_SENTENCE);
  });

  test("falls back to the first index when the instance lacks the default", () => {
    renderForm({ indexes: VIRAL_ONLY });

    // Not All: resting on everything would make one click on an untouched
    // form the most expensive job the instance can run.
    expect(sentence()).toBe("Searching 1 of 9 indexes: GENOMIC_VRL.");
    expect(card("Custom").textContent).not.toMatch(/sample query/);
  });

  test("says so when the instance has no indexes at all", () => {
    renderForm({ indexes: [] });

    expect(
      screen.getByText("No indexes are available right now.")
    ).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Index scope" })).toBeNull();
  });

  test("submits a pasted FASTQ record as FASTA, named by its header", async () => {
    const onSubmitted = jest.fn();
    const submit = jest.fn().mockResolvedValue("job456");
    render(
      <LoganSearchForm onSubmitted={onSubmitted} search={search({ submit })} />
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "@read7 run=SRR1\nACGTACGT\n+\nIIIIIII#\n" },
    });
    expect(
      screen.getByText(
        "8 bases. FASTQ; headers and quality scores are ignored."
      )
    ).toBeTruthy();
    fireEvent.click(searchButton());

    expect(submit).toHaveBeenCalledWith({
      indexes: ["GENOMIC_INV"],
      sequence: ">read7 run=SRR1\nACGTACGT\n",
      threshold: 0.5,
      zvalue: 6,
    });
    await waitFor(() =>
      expect(onSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: "job456", queryName: "read7" })
      )
    );
  });

  test("holds back a multi-record FASTQ the way it does FASTA", () => {
    const { submit } = renderForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "@a\nACGT\n+\nIIII\n@b\nACGT\n+\nIIII\n" },
    });

    expect(
      screen.getByText("2 records, but a query is one sequence")
    ).toBeTruthy();
    expect(searchButton().disabled).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });

  test("says what is wrong with a malformed FASTQ and won't submit it", () => {
    renderForm();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "@a\nACGTA\n+\nIIII\n" },
    });

    expect(
      screen.getByText(
        "Malformed FASTQ: record 1 has 5 bases but 4 quality scores."
      )
    ).toBeTruthy();
    expect(searchButton().disabled).toBe(true);
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
      expect(bases).toBeLessThanOrEqual(5000);
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
   * The hidden file input behind the Load FASTA/FASTQ file button.
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

  test("accepts the FASTA and FASTQ extensions and plain text", () => {
    renderForm();

    expect(
      screen.getByText("Load FASTA/FASTQ file").closest("label")
    ).toBeTruthy();
    expect(fileInput().accept).toBe(".fa,.fasta,.fna,.fq,.fastq,.txt");
  });

  test("reads a FASTQ file into the query box as written", async () => {
    renderForm();
    pick(new File(["@r1\nACGTACGTAC\n+\nIIIIIIIIII\n"], "reads.fq"));

    await screen.findByText(
      "10 bases. FASTQ; headers and quality scores are ignored."
    );
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      "@r1\nACGTACGTAC\n+\nIIIIIIIIII\n"
    );
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
    pick(new File([`>long\n${"A".repeat(5001)}\n`], "long.fasta"));

    await screen.findByText(/5001 bases, but queries are capped at 5000/);
    expect(searchButton().disabled).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });

  test("holds back a file with more than one record and says why", async () => {
    const { submit } = renderForm();
    pick(new File([">a\r\nACGTACGT\r\n>b\r\nACGT\r\n"], "primers.fa"));

    await screen.findByText("2 records, but a query is one sequence");
    expect(searchButton().disabled).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });

  test("refuses a file that isn't plain text, leaving the box alone", async () => {
    renderForm();
    const before = (screen.getByRole("textbox") as HTMLTextAreaElement).value;
    pick(
      new File([new Uint8Array([0x3e, 0x71, 0x0a, 0xff, 0xfe, 0x41])], "q.fa")
    );

    expect((await screen.findByRole("alert")).textContent).toMatch(
      /q\.fa isn't a plain-text FASTA or FASTQ file/
    );
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      before
    );
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
