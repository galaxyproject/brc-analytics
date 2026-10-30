import { GeneDetailView } from "@brc/views/GeneDetailView/geneDetailView";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { type Gene } from "@repo/shared/services/genes/types";
import { render, screen } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

// AMA1, as the gene API returns it for the checked-in 3D7 snapshot. Typed in
// full, not cast, so the type checker sees every GeneOrganism field.
const GENE: Gene = {
  aliases: [],
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
};

const theme = createTheme();

describe("GeneDetailView", () => {
  it("links the organism to its species' organism page", () => {
    render(
      <ThemeProvider theme={theme}>
        <EmotionThemeProvider theme={theme}>
          <GeneDetailView gene={GENE} />
        </EmotionThemeProvider>
      </ThemeProvider>
    );
    const link = screen.getByRole("link", {
      name: "Plasmodium falciparum 3D7",
    });
    // The species' ID (5833), not the strain's (36329), which has no page.
    expect(link).toHaveAttribute("href", "/data/organisms/5833");
    expect(link).not.toHaveAttribute("target");
  });
});
