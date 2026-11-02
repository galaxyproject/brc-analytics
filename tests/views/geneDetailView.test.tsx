import { GeneDetailView } from "@brc/views/GeneDetailView/geneDetailView";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { type Gene } from "@repo/shared/services/genes/types";
import { render, screen, within } from "@testing-library/react";
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
    annotationSetVersionId: "asv",
    genesAsOf: null,
    provider: null,
    publisher: "NCBI RefSeq",
    releaseDate: null,
    releaseLabel: null,
    retrievedAt: "2026-10-01T00:00:00Z",
  },
  status: "current",
  symbol: "AMA1",
  transcripts: [],
  ucscBrowserUrl: "https://genome.ucsc.edu/h/GCF_000002765.6",
};

const LOCATION_TEXT = "NC_037282.1:1,292,966-1,296,696 (+)";

const theme = createTheme();

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
 */
function renderGene(gene: Gene): void {
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <GeneDetailView gene={gene} />
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

  it("shows the gene ID as plain text when the gene has no NCBI GeneID", () => {
    renderGene({ ...GENE, aliases: [] });
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
