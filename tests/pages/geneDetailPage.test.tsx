import Page from "@brc/pages/data/genes/detail";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { render, screen } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

const MOCK_GENE_UID = "PF3D7_0102200";

jest.mock("next/router", () => ({
  useRouter: (): unknown => ({ isReady: true, query: { uid: MOCK_GENE_UID } }),
}));

// The gene the page asks for; it is never answered, so the page shows its
// loading state.
const mockUseGene = jest.fn();
jest.mock("@repo/shared/hooks/useGene", () => ({
  useGene: (uid: string | undefined): unknown => {
    mockUseGene(uid);
    return { status: "loading" };
  },
}));

jest.mock("@repo/shared/hooks/useGeneBionym", () => ({
  useGeneBionym: (): undefined => undefined,
}));

const theme = createTheme();

/**
 * Render the gene detail page at ?uid=MOCK_GENE_UID.
 */
function renderPage(): void {
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <Page />
      </EmotionThemeProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockUseGene.mockReset();
});

describe("Gene detail page", () => {
  it("is a 404 that fetches no gene when the demo flag is unset", () => {
    renderPage();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(mockUseGene).not.toHaveBeenCalledWith(MOCK_GENE_UID);
  });

  it("fetches ?uid= when the demo flag is set", () => {
    window.localStorage.setItem(FEATURE_FLAGS.DEMO, "true");
    renderPage();
    expect(screen.queryByText("404")).not.toBeInTheDocument();
    expect(mockUseGene).toHaveBeenLastCalledWith(MOCK_GENE_UID);
    expect(screen.getByText("Loading gene…")).toBeInTheDocument();
  });
});
