import Page from "@brc/pages/data/genes/index";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { fireEvent, render, screen } from "@testing-library/react";
// jest-dom matchers aren't registered globally in this repo's jest config.
import "@testing-library/jest-dom";

// The router the page reads ?q= from and pushes searches to.
const mockPush = jest.fn();
let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  useRouter: (): unknown => ({
    basePath: "",
    isReady: true,
    pathname: "/data/genes",
    push: mockPush,
    query: mockQuery,
  }),
}));

jest.mock(
  "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag",
  () => ({ useFeatureFlag: (): boolean => true })
);

// The search the page asks for; it is never answered, so the page shows its
// example genes.
const mockUseGeneSearch = jest.fn();
jest.mock("@repo/shared/hooks/useGeneSearch", () => ({
  useGeneSearch: (q: string): unknown => {
    mockUseGeneSearch(q);
    return { status: "idle" };
  },
}));

const theme = createTheme();

/**
 * Render the genes page at a URL with the given query.
 * @param query - The URL's query parameters.
 */
function renderPage(query: Record<string, string> = {}): void {
  mockQuery = query;
  render(
    <ThemeProvider theme={theme}>
      <EmotionThemeProvider theme={theme}>
        <Page />
      </EmotionThemeProvider>
    </ThemeProvider>
  );
}

/**
 * Type into the search box and submit it.
 * @param text - What to type.
 */
function submit(text: string): void {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: text } });
  fireEvent.submit(screen.getByRole("search"));
}

beforeEach(() => {
  mockPush.mockReset();
  mockUseGeneSearch.mockReset();
});

describe("Genes page", () => {
  it("searches for ?q=, trimmed", () => {
    renderPage({ q: " ama " });
    expect(mockUseGeneSearch).toHaveBeenLastCalledWith("ama");
    expect(screen.getByRole("searchbox")).toHaveValue("ama");
  });

  it("makes no search without ?q=", () => {
    renderPage();
    expect(mockUseGeneSearch).toHaveBeenLastCalledWith("");
  });

  it("pushes a new search as ?q=, so it is a history entry", () => {
    renderPage({ q: "ama" });
    submit("apical memb");
    expect(mockPush).toHaveBeenCalledWith(
      { pathname: "/data/genes", query: { q: "apical memb" } },
      undefined,
      { shallow: true }
    );
  });

  it("pushes an emptied search without ?q=", () => {
    renderPage({ q: "ama" });
    submit("   ");
    expect(mockPush).toHaveBeenCalledWith(
      { pathname: "/data/genes", query: {} },
      undefined,
      { shallow: true }
    );
  });
});
