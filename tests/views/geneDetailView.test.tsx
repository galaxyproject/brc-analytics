import { GeneDetailView } from "@brc/views/GeneDetailView/geneDetailView";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import {
  type BionymClaims,
  type Gene,
} from "@repo/shared/services/genes/types";
import { fireEvent, render, screen, within } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

// findable-ui's StaticImage reads the base path from the router.
jest.mock("next/router", () => ({
  useRouter: (): { basePath: string } => ({ basePath: "" }),
}));

// AMA1, as the gene API returns it for the checked-in 3D7 snapshot. Typed in
// full, not cast, so the type checker sees every GeneOrganism field.
const GENE: Gene = {
  aliases: [
    {
      current: true,
      publisher: "NCBI RefSeq",
      type: "ncbi_gene_id",
      value: "810891",
      via: null,
    },
  ],
  assemblyAccession: "GCF_000002765.6",
  biotype: "protein_coding",
  geneUid: "d9049485-ed74-5455-98c2-5dc13eef544a",
  location: {
    end: 1296696,
    seqName: "NC_037282.1",
    start: 1292966,
    strand: "+",
  },
  locusTag: "PF3D7_1133400",
  name: "AMA1",
  organism: {
    name: "Plasmodium falciparum 3D7",
    speciesTaxonomyId: "5833",
    taxonomyId: "36329",
  },
  pageUrl:
    "http://localhost:3000/data/genes/detail?uid=d9049485-ed74-5455-98c2-5dc13eef544a",
  provenance: {
    annotationSetVersionId: "ncbi-refseq-GCF_000002765.6-6ebba335",
    genesAsOf: null,
    provider: "Community Annotation",
    publisher: "NCBI RefSeq",
    releaseDate: "2026-09-18",
    releaseLabel: "RS_2026_09",
    retrievedAt: "2026-11-03T01:27:26Z",
  },
  status: "current",
  symbol: "AMA1",
  transcripts: [],
  ucscBrowserUrl: "https://genome.ucsc.edu/h/GCF_000002765.6",
};

const LOCATION_TEXT = "NC_037282.1:1,292,966-1,296,696 (+)";

const theme = createTheme();

// A BioNym graph's claims, as the gene API returns them: sources by title, and
// each source's claims by confidence, highest first.
const BIONYM: BionymClaims = {
  geneUid: GENE.geneUid,
  input: "PF3D7_1133400",
  runDate: "2026-11-02",
  sources: [
    {
      claims: [
        { confidence: 0.85, quote: "Quote A1.", text: "Claim A1" },
        { confidence: 0.5, quote: "Quote A2.", text: "Claim A2" },
      ],
      id: "pubmed:1",
      kind: "paper",
      title: "A paper",
      url: "https://pubmed.ncbi.nlm.nih.gov/1/",
    },
    {
      claims: [
        { confidence: 0.99, quote: "Quote B1.", text: "Claim B1" },
        { confidence: 0.9, quote: "Quote B2.", text: "Claim B2" },
      ],
      id: "dataset:2",
      kind: "dataset",
      title: "B dataset",
      url: null,
    },
  ],
};

/**
 * The value of one of the gene page's fields.
 * @param label - Field label, e.g. "Gene ID".
 * @returns The value element.
 */
function getFieldValue(label: string): HTMLElement {
  const value = screen.getByText(label).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`No ${label} value`);
  return value;
}

/**
 * Renders the gene page for the given gene.
 * @param gene - Gene.
 * @param bionym - The claims in the gene's BioNym graph, if it has one.
 */
function renderGene(gene: Gene, bionym: BionymClaims | null = null): void {
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <GeneDetailView bionym={bionym} gene={gene} />
      </EmotionThemeProvider>
    </ThemeProvider>
  );
}

describe("GeneDetailView", () => {
  it("links the organism to its species' organism page", () => {
    renderGene(GENE);
    const link = screen.getByRole("link", {
      name: "Plasmodium falciparum 3D7",
    });
    // The species' ID (5833), not the strain's (36329), which has no page.
    expect(link).toHaveAttribute("href", "/data/organisms/5833");
    expect(link).not.toHaveAttribute("target");
  });

  it("links the gene ID to its NCBI Gene page, in a new tab", () => {
    renderGene(GENE);
    const link = screen.getByRole("link", { name: /PF3D7_1133400/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.ncbi.nlm.nih.gov/gene/810891"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("PF3D7_1133400");
    expect(
      within(link).getByRole("img", { name: "opens in a new tab" })
    ).toBeInTheDocument();
  });

  it("shows a protein-coding gene's type by its display name", () => {
    renderGene(GENE);
    expect(getFieldValue("Gene type")).toHaveTextContent(/^Protein-coding$/);
  });

  it("shows a gene type that isn't protein-coding", () => {
    renderGene({ ...GENE, biotype: "tRNA" });
    expect(getFieldValue("Gene type")).toHaveTextContent(/^tRNA$/);
  });

  it("shows a gene type with no display name as written", () => {
    renderGene({ ...GENE, biotype: "new_biotype" });
    expect(getFieldValue("Gene type")).toHaveTextContent(/^new_biotype$/);
  });

  it("shows a dash when the gene has no type", () => {
    renderGene({ ...GENE, biotype: null });
    expect(getFieldValue("Gene type")).toHaveTextContent(/^—$/);
  });

  it("links the NCBI GeneID to its NCBI Gene page, in a new tab", () => {
    renderGene(GENE);
    const link = within(getFieldValue("NCBI GeneID")).getByRole("link", {
      name: /810891/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.ncbi.nlm.nih.gov/gene/810891"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("810891");
  });

  it("leaves out previous IDs when the gene has none", () => {
    renderGene(GENE);
    expect(screen.queryByText("Previous IDs")).not.toBeInTheDocument();
  });

  it("lists each previous ID with its publisher", () => {
    // TOP6A, which has a previous locus tag.
    renderGene({
      ...GENE,
      aliases: [
        ...GENE.aliases,
        {
          current: false,
          publisher: "NCBI RefSeq",
          type: "old_locus_tag",
          value: "PF3D7_1217100.2",
          via: null,
        },
        {
          current: false,
          publisher: "NCBI GenBank",
          type: "old_locus_tag",
          value: "PFL0815w",
          via: null,
        },
      ],
      locusTag: "PF3D7_1217100",
      name: "TOP6A",
      symbol: "TOP6A",
    });
    expect(
      Array.from(
        getFieldValue("Previous IDs").children,
        (child) => child.textContent
      )
    ).toStrictEqual([
      "PF3D7_1217100.2 (NCBI RefSeq)",
      "PFL0815w (NCBI GenBank)",
    ]);
  });

  it("names the annotation the gene was read from and when it was retrieved", () => {
    renderGene(GENE);
    expect(getFieldValue("Annotation")).toHaveTextContent(
      /^NCBI RefSeq \(Community Annotation, RS_2026_09, released 2026-09-18\), retrieved 2026-11-03$/
    );
  });

  it("adds the date the annotation's genes last changed, when known", () => {
    renderGene({
      ...GENE,
      provenance: { ...GENE.provenance, genesAsOf: "2026-10-01" },
    });
    expect(getFieldValue("Annotation")).toHaveTextContent(
      "(Community Annotation, RS_2026_09, released 2026-09-18; genes as of 2026-10-01)"
    );
  });

  it("leaves out the annotation fields it doesn't give", () => {
    renderGene({
      ...GENE,
      provenance: {
        ...GENE.provenance,
        provider: null,
        releaseLabel: null,
      },
    });
    expect(getFieldValue("Annotation")).toHaveTextContent(
      /^NCBI RefSeq \(released 2026-09-18\), retrieved 2026-11-03$/
    );
  });

  it("leaves out the brackets when the annotation gives no details", () => {
    renderGene({
      ...GENE,
      provenance: {
        ...GENE.provenance,
        provider: null,
        releaseDate: null,
        releaseLabel: null,
      },
    });
    expect(getFieldValue("Annotation")).toHaveTextContent(
      /^NCBI RefSeq, retrieved 2026-11-03$/
    );
  });

  it("shows the gene ID as plain text when the gene has no NCBI GeneID", () => {
    renderGene({ ...GENE, aliases: [] });
    expect(getFieldValue("NCBI GeneID")).toHaveTextContent(/^—$/);
    // The title and breadcrumb show the ID too, so read the field's value.
    const value = getFieldValue("Gene ID");
    expect(value).toHaveTextContent("PF3D7_1133400");
    expect(
      screen.queryByRole("link", { name: /PF3D7_1133400/ })
    ).not.toBeInTheDocument();
    // No off-site icon beside the unlinked ID.
    expect(
      within(value).queryByRole("img", { name: "opens in a new tab" })
    ).not.toBeInTheDocument();
  });

  it("links the location to UCSC at the gene's coordinates, in a new tab", () => {
    renderGene(GENE);
    const link = screen.getByRole("link", { name: /NC_037282\.1/ });
    expect(link).toHaveAttribute(
      "href",
      "https://genome.ucsc.edu/h/GCF_000002765.6?position=NC_037282.1:1292966-1296696"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent(LOCATION_TEXT);
    expect(
      within(link).getByRole("img", { name: "UCSC Genome Browser" })
    ).toBeInTheDocument();
  });

  it("shows the location as plain text when the assembly has no UCSC browser", () => {
    renderGene({ ...GENE, ucscBrowserUrl: null });
    const value = getFieldValue("Location");
    expect(value).toHaveTextContent(LOCATION_TEXT);
    expect(
      screen.queryByRole("link", { name: /NC_037282\.1/ })
    ).not.toBeInTheDocument();
    // No UCSC logo or off-site icon beside the unlinked location.
    expect(
      within(value).queryByRole("img", { name: "UCSC Genome Browser" })
    ).not.toBeInTheDocument();
    expect(
      within(value).queryByRole("img", { name: "opens in a new tab" })
    ).not.toBeInTheDocument();
  });

  it("lists each transcript, with a dash for each missing value", () => {
    const location = GENE.location;
    renderGene({
      ...GENE,
      transcripts: [
        {
          gff3RowId: "rna-XM_001347979.2",
          location,
          proteinAccession: "XP_001348015.1",
          proteinProduct: "apical membrane antigen 1",
          transcriptId: "XM_001347979.2",
          transcriptProduct: "apical membrane antigen 1",
        },
        // A transcript with no transcript ID or protein, as for a tRNA.
        {
          gff3RowId: "rna-PF3D7_1133400",
          location,
          proteinAccession: null,
          proteinProduct: null,
          transcriptId: null,
          transcriptProduct: "tRNA-Ala",
        },
      ],
    });
    const [, first, second] = screen.getAllByRole("row");
    expect(
      Array.from(first.querySelectorAll("td"), (td) => td.textContent)
    ).toStrictEqual([
      "XM_001347979.2",
      "apical membrane antigen 1",
      "XP_001348015.1",
      "apical membrane antigen 1",
    ]);
    expect(
      Array.from(second.querySelectorAll("td"), (td) => td.textContent)
    ).toStrictEqual(["—", "tRNA-Ala", "—", "—"]);
  });
});

describe("GeneDetailView's BioNym section", () => {
  /**
   * The section, found by its heading.
   * @returns The section.
   */
  function getSection(): HTMLElement {
    return screen.getByRole("region", { name: "Evidence gathered by BioNym" });
  }

  /**
   * The titles of the sources shown, in order.
   * @returns The titles.
   */
  function sourceTitles(): string[] {
    return within(getSection())
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent ?? "");
  }

  /**
   * Move the minimum-confidence slider.
   * @param value - The value to move it to.
   */
  function setMinConfidence(value: number): void {
    fireEvent.change(
      within(getSection()).getByRole("slider", { name: "Minimum confidence" }),
      { target: { value } }
    );
  }

  it("isn't shown for a gene with no graph", () => {
    renderGene(GENE);
    expect(
      screen.queryByRole("region", { name: "Evidence gathered by BioNym" })
    ).not.toBeInTheDocument();
  });

  it("labels the claims as BioNym's scored judgments and links to BioNym", () => {
    renderGene(GENE, BIONYM);
    const section = getSection();
    expect(section).toHaveTextContent(
      /drawn from papers and datasets by a language model/
    );
    expect(section).toHaveTextContent(/November 02, 2026/);
    expect(
      within(section).getByRole("link", { name: "BioNym" })
    ).toHaveAttribute("href", "https://github.com/d-callan/bionym");
  });

  it("shows claims at or above 0.8, by source, as their text alone", () => {
    renderGene(GENE, BIONYM);
    const section = getSection();
    expect(section).toHaveTextContent("3 of 4 claims");
    // The source with more claims shown comes first.
    expect(sourceTitles()).toStrictEqual(["B dataset", "A paper"]);
    expect(within(section).getByText("Claim B1")).toBeInTheDocument();
    expect(section).not.toHaveTextContent("Quote B1.");
    expect(section).not.toHaveTextContent("0.99");
    expect(within(section).queryByText("Claim A2")).not.toBeInTheDocument();
    expect(
      within(section).getByRole("link", { name: "A paper" })
    ).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/1/");
    // A source with no https: link is shown as text.
    expect(
      within(section).queryByRole("link", { name: "B dataset" })
    ).not.toBeInTheDocument();
  });

  it("hides claims below the slider's value and updates the count", () => {
    renderGene(GENE, BIONYM);
    setMinConfidence(0.95);
    expect(getSection()).toHaveTextContent("1 of 4 claims");
    expect(sourceTitles()).toStrictEqual(["B dataset"]);
    setMinConfidence(0);
    expect(getSection()).toHaveTextContent("4 of 4 claims");
    // Tied on claims shown, the sources are in title order.
    expect(sourceTitles()).toStrictEqual(["A paper", "B dataset"]);
    expect(within(getSection()).getByText("Claim A2")).toBeInTheDocument();
  });

  it("keeps a claim at the slider's value after arrow-key steps", () => {
    renderGene(GENE, BIONYM);
    const slider = within(getSection()).getByRole("slider", {
      name: "Minimum confidence",
    });
    // Five steps of 0.01 from 0.8 sum to 0.8500000000000001 in floating point,
    // which would hide claim A1 at 0.85.
    for (let i = 0; i < 5; i++)
      fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "0.85");
    expect(getSection()).toHaveTextContent("3 of 4 claims");
  });

  it("shows a claim's quote in a tooltip on hover", async () => {
    renderGene(GENE, BIONYM);
    fireEvent.mouseOver(within(getSection()).getByText("Claim B1"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Quote B1.");
  });
});
