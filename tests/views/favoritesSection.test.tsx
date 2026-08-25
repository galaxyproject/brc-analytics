import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import { FavoritesSection } from "@repo/shared/views/AccountView/components/FavoritesSection/favoritesSection";
import { render, screen } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument, toBeDisabled) aren't registered
// globally in this repo's jest config; opt in locally as the sibling account
// suites do.
import "@testing-library/jest-dom";

// Only useFavorites is stubbed -- favoriteKey stays real, so the component
// importing it (rather than re-deriving the `${type}:${id}` format inline)
// resolves to the actual implementation, not undefined.
jest.mock("@repo/shared/providers/favorites/provider", () => ({
  ...jest.requireActual("@repo/shared/providers/favorites/provider"),
  useFavorites: jest.fn(),
}));
// requireActual above still evaluates the provider module top-to-bottom,
// which imports the real api-client -- and that pulls in ky, an ESM-only
// package Jest can't parse. Stub it out; nothing here calls it.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    getFavorites: jest.fn(),
  },
}));

const mockUseFavorites = useFavorites as jest.MockedFunction<
  typeof useFavorites
>;

const theme = createTheme();

/**
 * Renders FavoritesSection for assemblies with one favorite, under the theme
 * providers AccountCard's styles need.
 * @param overrides - Fields to override on the mocked favorites context.
 * @returns the render result.
 */
function renderSection(
  overrides: Partial<ReturnType<typeof useFavorites>> = {}
): ReturnType<typeof render> {
  mockUseFavorites.mockReturnValue({
    error: null,
    favorites: [
      {
        created_at: "2026-08-01T00:00:00Z",
        entity_id: "GCF_000001405.40",
        entity_type: "assembly",
      },
    ],
    isFavorited: () => false,
    isLoading: false,
    isToggling: false,
    toggleFavorite: jest.fn(),
    togglingKey: null,
    ...overrides,
  } as unknown as ReturnType<typeof useFavorites>);

  return render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <FavoritesSection entityType={ENTITY_TYPE.ASSEMBLY} />
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

describe("FavoritesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("disables Remove for the row currently toggling, using the shared favoriteKey format", () => {
    renderSection({ togglingKey: "assembly:GCF_000001405.40" });

    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  test("leaves Remove enabled when a different row is toggling", () => {
    renderSection({ togglingKey: "organism:5833" });

    expect(screen.getByRole("button", { name: "Remove" })).not.toBeDisabled();
  });

  test("does not render its own error alert -- AccountView surfaces the shared failure once", () => {
    renderSection({ error: new Error("favorites unavailable") });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("does not claim nothing is saved when the shared favorites load failed", () => {
    renderSection({ error: new Error("favorites unavailable"), favorites: [] });

    expect(
      screen.queryByText(
        "Save an assembly from its page or from the assemblies list to keep it here."
      )
    ).not.toBeInTheDocument();
  });
});
