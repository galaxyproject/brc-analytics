import {
  geneLabel,
  geneSymbol,
  geneTitle,
} from "@repo/shared/services/genes/label";

describe("gene label, symbol and title", () => {
  it.each([
    // AMA1: locus tag, a symbol, and NCBI's Name is the symbol.
    [
      { locusTag: "PF3D7_1133400", name: "AMA1", symbol: "AMA1" },
      "PF3D7_1133400",
      "AMA1",
      "PF3D7_1133400 (AMA1)",
    ],
    // No symbol: NCBI's Name is the locus tag.
    [
      { locusTag: "PF3D7_0105400", name: "PF3D7_0105400", symbol: null },
      "PF3D7_0105400",
      null,
      "PF3D7_0105400",
    ],
    // No locus tag (an Aedes tRNA): the name labels it, and the symbol, the
    // same as the name, isn't repeated.
    [
      { locusTag: null, name: "Trnaa-ggc", symbol: "Trnaa-ggc" },
      "Trnaa-ggc",
      null,
      "Trnaa-ggc",
    ],
  ])("%o", (gene, label, symbol, title) => {
    expect(geneLabel(gene)).toBe(label);
    expect(geneSymbol(gene)).toBe(symbol);
    expect(geneTitle(gene)).toBe(title);
  });
});
