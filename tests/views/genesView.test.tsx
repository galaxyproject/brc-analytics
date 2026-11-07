import { GenesView } from "@brc/views/GenesView/genesView";
import { describeMatch } from "@brc/views/GenesView/utils";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { type GeneSearchState } from "@repo/shared/hooks/useGeneSearch";
import { type GeneSearchResult } from "@repo/shared/services/genes/types";
import { fireEvent, render, screen, within } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

const theme = createTheme();

const ORGANISM = {
  name: "Plasmodium falciparum 3D7",
  speciesTaxonomyId: "5833",
  taxonomyId: "36329",
};

// Two results as the gene API returns them for "XP_001348015" and a word of
// a product.
const AMA1: GeneSearchResult = {
  assemblyAccession: "GCF_000002765.6",
  geneUid: "d9049485-ed74-5455-98c2-5dc13eef544a",
  locusTag: "PF3D7_1133400",
  matchedOn: { type: "protein_accession", value: "XP_001348015.1" },
  name: "AMA1",
  organism: ORGANISM,
  pageUrl: "",
  symbol: "AMA1",
};

const TRAMP: GeneSearchResult = {
  ...AMA1,
  geneUid: "b26f0626-b67d-5782-98be-68fc176971da",
  locusTag: "PF3D7_1218000",
  matchedOn: {
    type: "protein_product",
    value: "thrombospondin-related apical membrane protein",
  },
  name: "TRAMP",
  symbol: null,
};

/**
 * Render the genes page's view.
 * @param search - The search's state.
 * @param query - The search shown.
 * @returns The onSearch mock.
 */
function renderView(search: GeneSearchState, query = ""): jest.Mock {
  const onSearch = jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <GenesView onSearch={onSearch} query={query} search={search} />
      </EmotionThemeProvider>
    </ThemeProvider>
  );
  return onSearch;
}

/**
 * A found search's state.
 * @param results - The genes found.
 * @param truncated - Whether more genes matched.
 * @returns The state.
 */
function found(
  results: GeneSearchResult[],
  truncated = false
): GeneSearchState {
  return { results, status: "found", truncated };
}

describe("GenesView", () => {
  it("shows the example genes until a search is made", () => {
    renderView({ status: "idle" });
    expect(
      screen.getByRole("columnheader", { name: "Example of" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "PF3D7_1133400" })).toHaveAttribute(
      "href",
      "/data/genes/detail?uid=d9049485-ed74-5455-98c2-5dc13eef544a"
    );
  });

  it("searches for the box's text, trimmed, when submitted", () => {
    const onSearch = renderView({ status: "idle" });
    const box = screen.getByRole("searchbox", { name: "Search genes" });
    fireEvent.change(box, { target: { value: "  apical memb " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(onSearch).toHaveBeenCalledWith("apical memb");
  });

  it("doesn't search again for the search already shown", () => {
    const onSearch = renderView(found([AMA1]), "ama");
    fireEvent.submit(screen.getByRole("search"));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("retries the search already shown if it failed", () => {
    const retry = jest.fn();
    const onSearch = renderView({ retry, status: "unavailable" }, "ama");
    fireEvent.submit(screen.getByRole("search"));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("searches when the box's text differs from the search shown", () => {
    const onSearch = renderView(found([AMA1]), "ama");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ama1" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(onSearch).toHaveBeenCalledWith("ama1");
  });

  it("shows the search in the box", () => {
    renderView(found([AMA1]), "ama");
    expect(screen.getByRole("searchbox")).toHaveValue("ama");
  });

  it("lists each result with what it matched on", () => {
    renderView(found([AMA1, TRAMP]));
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      "PF3D7_1133400AMA1Plasmodium falciparum 3D7Matched protein accession XP_001348015.1",
      'PF3D7_1218000—Plasmodium falciparum 3D7Matched protein product "thrombospondin-related apical membrane protein"',
    ]);
    expect(
      within(rows[1]).getByRole("link", { name: "PF3D7_1218000" })
    ).toHaveAttribute("href", `/data/genes/detail?uid=${TRAMP.geneUid}`);
    expect(screen.queryByText(/refine your search/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Example of" })
    ).not.toBeInTheDocument();
  });

  it("says when the results are only the first 50", () => {
    renderView(found([AMA1], true));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing the first 50 matches; refine your search."
    );
  });

  it.each<[GeneSearchState, string]>([
    [found([]), "No genes match “ama”."],
    [{ status: "loading" }, "Searching…"],
    [
      { retry: jest.fn(), status: "unavailable" },
      "Gene search is unavailable right now. Please try again later.",
    ],
    [{ status: "invalid" }, "Search for at most 10 words and 200 characters."],
  ])("says why there are no results (%p)", (search, message) => {
    renderView(search, "ama");
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("describeMatch", () => {
  it.each([
    ["locus_tag", "PF3D7_1133400", "Matched locus tag PF3D7_1133400"],
    ["ncbi_gene_id", "810891", "Matched NCBI Gene ID 810891"],
    [
      "old_locus_tag",
      "PF3D7_0105400.1",
      "Matched old locus tag PF3D7_0105400.1",
    ],
    ["transcript_id", "XM_001347979.2", "Matched transcript ID XM_001347979.2"],
    [
      "transcript_product",
      "apical membrane antigen 1",
      'Matched transcript product "apical membrane antigen 1"',
    ],
    ["symbol", "AMA1", "Matched symbol AMA1"],
    [
      "protein_product",
      "apical membrane antigen 1",
      'Matched protein product "apical membrane antigen 1"',
    ],
  ])("describes a %s match", (type, value, text) => {
    expect(describeMatch({ type, value })).toBe(text);
  });
});
