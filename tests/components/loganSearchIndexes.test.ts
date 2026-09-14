import {
  axisOptions,
  describeIndexSelection,
  indexDivision,
  joinNaturally,
  selectIndexes,
} from "@brc/components/LoganSearch/utils";

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

/**
 * The codes an axis offers, in the order it offers them.
 * @param options - Options as axisOptions returned them.
 * @returns Just the codes.
 */
function codesOf(options: { code: string }[]): string[] {
  return options.map((option) => option.code);
}

/**
 * The count an axis reported for one code.
 * @param options - Options as axisOptions returned them.
 * @param code - The code to look up.
 * @returns Its count, or undefined when the code is not offered.
 */
function countOf(
  options: { code: string; count: number }[],
  code: string
): number | undefined {
  return options.find((option) => option.code === code)?.count;
}

describe("the index fixture", () => {
  test("is the 109 names dev registers", () => {
    expect(INDEXES).toHaveLength(109);
    expect(INDEXES.filter((index) => index.endsWith("_ENV"))).toEqual([
      "METAGENOMIC_ENV",
    ]);
  });
});

describe("indexDivision", () => {
  test("reads the token after the last underscore", () => {
    expect(indexDivision("METAGENOMIC_ENV")).toBe("ENV");
    expect(indexDivision("GENOMICSINGLECELL_BCT")).toBe("BCT");
  });

  test("returns the whole name when there is no separator", () => {
    expect(indexDivision("GENOMIC")).toBe("GENOMIC");
  });
});

describe("axisOptions", () => {
  test("lists divisions in table order with their counts", () => {
    const options = axisOptions(INDEXES, "division");

    expect(codesOf(options)).toEqual([
      "BCT",
      "VRL",
      "PHG",
      "PLN",
      "INV",
      "VRT",
      "MAM",
      "ROD",
      "MICE",
      "PRI",
      "HUMAN",
      "ENV",
      "UNKNOWN",
    ]);
    expect(countOf(options, "BCT")).toBe(9);
    expect(countOf(options, "ENV")).toBe(1);
  });

  test("lists strategies in table order with their counts", () => {
    const options = axisOptions(INDEXES, "strategy");

    expect(codesOf(options)).toEqual([
      "GENOMIC",
      "METAGENOMIC",
      "TRANSCRIPTOMIC",
      "METATRANSCRIPTOMIC",
      "GENOMICSINGLECELL",
      "TRANSCRIPTOMICSINGLECELL",
      "VIRALRNA",
      "SYNTHETIC",
      "OTHER",
    ]);
    expect(countOf(options, "METAGENOMIC")).toBe(13);
  });

  test("labels divisions and notes the ones a label would mislead about", () => {
    const options = axisOptions(INDEXES, "division");

    expect(options[0]).toEqual({
      code: "BCT",
      count: 9,
      label: "Bacteria",
      note: "Bacteria and archaea.",
    });
    expect(options.find((option) => option.code === "VRL")).toEqual({
      code: "VRL",
      count: 9,
      label: "Viruses",
    });
  });

  test("puts a code the table does not know last, as itself", () => {
    const withExtra = [...INDEXES, "FOO_BAR"];

    expect(codesOf(axisOptions(withExtra, "division")).slice(-2)).toEqual([
      "UNKNOWN",
      "BAR",
    ]);
    expect(codesOf(axisOptions(withExtra, "strategy")).slice(-2)).toEqual([
      "OTHER",
      "FOO",
    ]);
    expect(
      axisOptions(withExtra, "division").find((option) => option.code === "BAR")
    ).toEqual({ code: "BAR", count: 1, label: "BAR" });
  });

  test("leaves out a table code nothing is registered under", () => {
    const withoutHuman = INDEXES.filter(
      (index) => indexDivision(index) !== "HUMAN"
    );

    expect(codesOf(axisOptions(withoutHuman, "division"))).not.toContain(
      "HUMAN"
    );
  });
});

describe("selectIndexes", () => {
  test("an empty pair of selections is every index, in input order", () => {
    expect(selectIndexes(INDEXES, [], [])).toEqual(INDEXES);
  });

  test("one division crosses every strategy", () => {
    expect(selectIndexes(INDEXES, ["VRL"], [])).toEqual([
      "GENOMIC_VRL",
      "GENOMICSINGLECELL_VRL",
      "METAGENOMIC_VRL",
      "METATRANSCRIPTOMIC_VRL",
      "OTHER_VRL",
      "SYNTHETIC_VRL",
      "TRANSCRIPTOMIC_VRL",
      "TRANSCRIPTOMICSINGLECELL_VRL",
      "VIRALRNA_VRL",
    ]);
  });

  test("both axes together are a product", () => {
    expect(selectIndexes(INDEXES, ["BCT"], ["GENOMIC", "METAGENOMIC"])).toEqual(
      ["GENOMIC_BCT", "METAGENOMIC_BCT"]
    );
  });

  test("an unregistered pairing selects nothing", () => {
    expect(selectIndexes(INDEXES, ["ENV"], ["GENOMIC"])).toEqual([]);
  });
});

describe("joinNaturally", () => {
  test("leaves one item alone", () => {
    expect(joinNaturally(["bacteria"])).toBe("bacteria");
  });

  test("joins two items with and", () => {
    expect(joinNaturally(["bacteria", "viruses"])).toBe("bacteria and viruses");
  });

  test("takes the Oxford comma from three items on", () => {
    expect(joinNaturally(["bacteria", "viruses", "phage"])).toBe(
      "bacteria, viruses, and phage"
    );
  });
});

describe("describeIndexSelection", () => {
  test("says so when the pairing is empty", () => {
    expect(
      describeIndexSelection({
        libraries: ["Genomic"],
        organisms: ["Environmental"],
        selected: [],
        total: 109,
      })
    ).toBe("No index matches that combination.");
  });

  test("says all when the selection is everything", () => {
    expect(
      describeIndexSelection({
        libraries: [],
        organisms: [],
        selected: INDEXES,
        total: 109,
      })
    ).toBe("Searching all 109 indexes.");
  });

  test("names one index outright", () => {
    expect(
      describeIndexSelection({
        libraries: ["Genomic"],
        organisms: ["Invertebrates"],
        selected: ["GENOMIC_INV"],
        total: 109,
      })
    ).toBe("Searching 1 of 109 indexes: GENOMIC_INV.");
  });

  test("names four indexes outright", () => {
    expect(
      describeIndexSelection({
        libraries: ["Genomic", "Metagenomic"],
        organisms: ["Bacteria", "Invertebrates"],
        selected: [
          "GENOMIC_BCT",
          "GENOMIC_INV",
          "METAGENOMIC_BCT",
          "METAGENOMIC_INV",
        ],
        total: 109,
      })
    ).toBe(
      "Searching 4 of 109 indexes: GENOMIC_BCT, GENOMIC_INV, " +
        "METAGENOMIC_BCT, METAGENOMIC_INV."
    );
  });

  test("falls back to the axes past four, joining two labels with and", () => {
    expect(
      describeIndexSelection({
        libraries: [],
        organisms: ["Bacteria", "Invertebrates"],
        selected: new Array(18).fill("x"),
        total: 109,
      })
    ).toBe(
      "Searching 18 of 109 indexes: bacteria and invertebrates; " +
        "every library type."
    );
  });

  test("takes the Oxford comma on three labels", () => {
    expect(
      describeIndexSelection({
        libraries: ["Genomic"],
        organisms: ["Bacteria", "Viruses", "Phage"],
        selected: new Array(5).fill("x"),
        total: 109,
      })
    ).toBe(
      "Searching 5 of 109 indexes: bacteria, viruses, and phage; genomic."
    );
  });

  test("lowercases only the first character of a label", () => {
    expect(
      describeIndexSelection({
        libraries: ["Viral RNA", "Single-cell genomic"],
        organisms: [],
        selected: new Array(26).fill("x"),
        total: 109,
      })
    ).toBe(
      "Searching 26 of 109 indexes: every organism; viral RNA and " +
        "single-cell genomic."
    );
  });

  test("groups the digits of a large total", () => {
    expect(
      describeIndexSelection({
        libraries: [],
        organisms: ["Bacteria"],
        selected: new Array(1200).fill("x"),
        total: 13000,
      })
    ).toBe("Searching 1,200 of 13,000 indexes: bacteria; every library type.");
  });
});
