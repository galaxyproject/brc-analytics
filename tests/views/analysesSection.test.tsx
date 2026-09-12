import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";
import { AnalysesSection } from "@repo/shared/views/AccountView/components/AnalysesSection/analysesSection";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument) aren't registered globally in this
// repo's jest config; opt in locally as the sibling account suites do.
import "@testing-library/jest-dom";

jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    deleteSavedAnalysis: jest.fn(),
    openSavedAnalysis: jest.fn(),
  },
}));

const push = jest.fn().mockResolvedValue(undefined);
jest.mock("next/router", () => ({
  useRouter: (): { push: jest.Mock } => ({ push }),
}));

const mockClient = apiClient as jest.Mocked<typeof apiClient>;

const theme = createTheme();

const ANALYSIS: SavedAnalysisSummary = {
  created_at: "2026-08-01T00:00:00Z",
  id: "1",
  source_session: null,
  title: "Plasmodium run",
  updated_at: "2026-08-01T00:00:00Z",
};

/**
 * Renders AnalysesSection under the theme providers AccountCard's styles
 * need, with one item and stubbed resource handles.
 * @param setItems - Spy standing in for the resource's setItems.
 * @returns the render result.
 */
function renderSection(setItems: jest.Mock): ReturnType<typeof render> {
  return render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <AnalysesSection
          resource={{
            error: null,
            isLoading: false,
            items: [ANALYSIS],
            reload: jest.fn(),
            setItems,
          }}
        />
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

describe("AnalysesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("surfaces an error and leaves the row when delete fails", async () => {
    mockClient.deleteSavedAnalysis.mockRejectedValue(new Error("boom"));
    const setItems = jest.fn();

    renderSection(setItems);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Plasmodium run")).toBeInTheDocument();
    expect(setItems).not.toHaveBeenCalled();
  });

  test("surfaces an error when continuing a saved analysis fails", async () => {
    mockClient.openSavedAnalysis.mockRejectedValue(new Error("boom"));

    renderSection(jest.fn());
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });
});
