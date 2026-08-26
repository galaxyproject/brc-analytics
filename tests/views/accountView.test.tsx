import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import { AccountView } from "@repo/shared/views/AccountView/accountView";
import { render, screen, waitFor } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument, toHaveTextContent) aren't registered
// globally in this repo's jest config; opt in locally as the sibling account
// suites do.
import "@testing-library/jest-dom";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
// Only useFavorites is stubbed -- favoriteKey stays real, so FavoritesSection
// importing it (rather than re-deriving the format) doesn't resolve to
// undefined here.
jest.mock("@repo/shared/providers/favorites/provider", () => ({
  ...jest.requireActual("@repo/shared/providers/favorites/provider"),
  useFavorites: jest.fn(),
}));
// requireActual above still evaluates the provider module top-to-bottom,
// which imports the real api-client -- and that pulls in ky, an ESM-only
// package Jest can't parse. Stub it out.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    deleteSavedAnalysis: jest.fn(),
    getFavorites: jest.fn(),
    getSavedAnalyses: jest.fn(),
    getWorkflowRuns: jest.fn(),
    openSavedAnalysis: jest.fn(),
  },
}));
jest.mock("@repo/shared/services/workflows/query", () => ({
  findEntity: jest.fn(),
}));
jest.mock("next/router", () => ({
  useRouter: (): { push: jest.Mock } => ({ push: jest.fn() }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFavorites = useFavorites as jest.MockedFunction<
  typeof useFavorites
>;
const mockClient = apiClient as jest.Mocked<typeof apiClient>;

const theme = createTheme();

/**
 * Renders the view under the theme providers the app supplies -- AccountCard's
 * styles read the emotion theme, which has no default to fall back on.
 * @returns the render result.
 */
function renderAccountView(): ReturnType<typeof render> {
  return render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <AccountView />
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

function setFavorites(favorites: unknown[] = []): void {
  mockUseFavorites.mockReturnValue({
    error: null,
    favorites,
    isFavorited: () => false,
    isLoading: false,
    isToggling: false,
    toggleFavorite: jest.fn(),
    togglingKeys: new Set<string>(),
  } as unknown as ReturnType<typeof useFavorites>);
}

describe("AccountView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
      isLoading: false,
      login: jest.fn(),
      user: { email: "a@example.org", name: "Ada" },
    } as unknown as ReturnType<typeof useAuth>);
    setFavorites();
    mockClient.getSavedAnalyses.mockResolvedValue([]);
    mockClient.getWorkflowRuns.mockResolvedValue([]);
  });

  test("shows a single loading state before deciding between sections and the empty panel", async () => {
    // getSavedAnalyses/getWorkflowRuns resolve on a post-mount effect, so the
    // synchronous render still reflects the workspace's not-yet-resolved
    // first load.
    renderAccountView();

    expect(
      screen.getByRole("progressbar", { name: "Loading your workspace" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText(/Browse assemblies/i)).not.toBeInTheDocument();

    // Let the pending fetches settle within the test so the resulting state
    // update doesn't land after the test has already finished.
    await waitFor(() =>
      expect(screen.getByText(/Browse assemblies/i)).toBeInTheDocument()
    );
  });

  test("shows a getting-started panel when everything is empty", async () => {
    renderAccountView();

    await waitFor(() =>
      expect(screen.getByText(/Browse assemblies/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Ask the assistant/i)).toBeInTheDocument();
  });

  test("renders all four sections once there is anything to show", async () => {
    mockClient.getSavedAnalyses.mockResolvedValue([
      {
        created_at: "2026-08-01T00:00:00Z",
        id: "1",
        title: "Plasmodium run",
        updated_at: "2026-08-01T00:00:00Z",
      },
    ] as never);

    renderAccountView();

    // Wait on the record rather than the region: the sections mount straight
    // away with their own spinners, so a region is on screen before the
    // analyses request has resolved.
    await waitFor(() =>
      expect(screen.getByText("Plasmodium run")).toBeInTheDocument()
    );
    expect(
      screen.getByRole("region", { name: "Analyses" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Saved assemblies" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Saved organisms" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Launches" })
    ).toBeInTheDocument();
  });

  test("splits favorites into their own section by entity type", async () => {
    setFavorites([
      {
        created_at: "2026-08-01T00:00:00Z",
        entity_id: "GCF_000001405.40",
        entity_type: "assembly",
      },
      {
        created_at: "2026-08-01T00:00:00Z",
        entity_id: "5833",
        entity_type: "organism",
      },
    ]);

    renderAccountView();

    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Saved assemblies" })
      ).toBeInTheDocument()
    );

    const assemblies = screen.getByRole("region", { name: "Saved assemblies" });
    const organisms = screen.getByRole("region", { name: "Saved organisms" });
    expect(assemblies).toHaveTextContent("GCF_000001405.40");
    expect(assemblies).not.toHaveTextContent("5833");
    expect(organisms).toHaveTextContent("5833");
  });

  test("shows an organism's species name rather than a bare taxonomy id", async () => {
    const { findEntity } = jest.requireMock(
      "@repo/shared/services/workflows/query"
    );
    findEntity.mockReturnValue({
      taxonomicLevelSpecies: "Plasmodium falciparum",
    });
    setFavorites([
      {
        created_at: "2026-08-01T00:00:00Z",
        entity_id: "5833",
        entity_type: "organism",
      },
    ]);

    renderAccountView();

    await waitFor(() =>
      expect(screen.getByText("Plasmodium falciparum")).toBeInTheDocument()
    );
  });

  test("falls back to the raw id when the catalog has no match", async () => {
    const { findEntity } = jest.requireMock(
      "@repo/shared/services/workflows/query"
    );
    findEntity.mockReturnValue(undefined);
    setFavorites([
      {
        created_at: "2026-08-01T00:00:00Z",
        entity_id: "5833",
        entity_type: "organism",
      },
    ]);

    renderAccountView();

    await waitFor(() => expect(screen.getByText("5833")).toBeInTheDocument());
  });

  test("surfaces a failed load rather than claiming the workspace is empty", async () => {
    mockClient.getSavedAnalyses.mockRejectedValue(
      new Error("analyses unavailable")
    );

    renderAccountView();

    await waitFor(() =>
      expect(screen.getByText("analyses unavailable")).toBeInTheDocument()
    );
    expect(screen.queryByText(/Browse assemblies/i)).not.toBeInTheDocument();
  });

  test("shows one alert, not two, when the shared favorites fetch fails", async () => {
    mockUseFavorites.mockReturnValue({
      error: new Error("favorites unavailable"),
      favorites: [],
      isFavorited: () => false,
      isLoading: false,
      isToggling: false,
      toggleFavorite: jest.fn(),
      togglingKeys: new Set<string>(),
    } as unknown as ReturnType<typeof useFavorites>);

    renderAccountView();

    await waitFor(() =>
      expect(screen.getAllByText("favorites unavailable")).toHaveLength(1)
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  test("prompts a signed-out visitor to sign in", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: false,
      login: jest.fn(),
      user: null,
    } as unknown as ReturnType<typeof useAuth>);

    renderAccountView();

    expect(screen.getByText("Sign in required")).toBeInTheDocument();
    expect(mockClient.getSavedAnalyses).not.toHaveBeenCalled();
  });

  test("never shows a status column for launches", async () => {
    mockClient.getWorkflowRuns.mockResolvedValue([
      {
        created_at: "2026-08-01T00:00:00Z",
        handoff_url: "https://galaxy.example/x",
        id: "r1",
        launch_source: "site",
        parameters: {},
        status: "handoff_created",
        updated_at: "2026-08-01T00:00:00Z",
        workflow_trs_id: "trs://x",
      },
    ] as never);

    renderAccountView();

    await waitFor(() =>
      expect(screen.getByText(/trs:\/\/x/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/handoff_created/)).not.toBeInTheDocument();
  });
});
