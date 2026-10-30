import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import type { FavoriteEntityType } from "@repo/shared/providers/favorites/types";
import { ROUTES } from "@repo/shared/routes/constants";
import { useEntityLists } from "@repo/shared/services/workflows/hooks/UseEntityLists/hook";
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
// Organism labels load the organisms list; that load is not under test here.
jest.mock("@repo/shared/services/workflows/hooks/UseEntityLists/hook", () => ({
  useEntityLists: jest.fn(),
}));

const mockUseFavorites = useFavorites as jest.MockedFunction<
  typeof useFavorites
>;

const mockUseEntityLists = useEntityLists as jest.MockedFunction<
  typeof useEntityLists
>;

const ORGANISM_FAVORITE = {
  created_at: "2026-08-01T00:00:00Z",
  entity_id: "5833",
  entity_type: "organism",
};

const theme = createTheme();

/**
 * Renders FavoritesSection (for assemblies with one favorite, by default),
 * under the theme providers AccountCard's styles need.
 * @param overrides - Fields to override on the mocked favorites context.
 * @param entityType - Which favorites the section lists.
 * @returns the render result.
 */
function renderSection(
  overrides: Partial<ReturnType<typeof useFavorites>> = {},
  entityType: FavoriteEntityType = ENTITY_TYPE.ASSEMBLY
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
    reload: jest.fn(),
    toggleFavorite: jest.fn(),
    togglingKeys: new Set<string>(),
    ...overrides,
  } as unknown as ReturnType<typeof useFavorites>);

  return render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <FavoritesSection entityType={entityType} />
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

describe("FavoritesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("builds the Open link from ROUTES, not a hand-rolled path", () => {
    // Renaming a detail route updates ROUTES and every view-model builder; a
    // path assembled here would keep linking at the old one.
    renderSection();

    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      ROUTES.GENOME.replace("{entityId}", sanitizeEntityId("GCF_000001405.40"))
    );
  });

  test("disables Remove for the row currently toggling, using the shared favoriteKey format", () => {
    renderSection({ togglingKeys: new Set(["assembly:GCF_000001405.40"]) });

    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  test("leaves Remove enabled when a different row is toggling", () => {
    renderSection({ togglingKeys: new Set(["organism:5833"]) });

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

  test("loads the organisms list to label saved organisms", () => {
    renderSection({ favorites: [ORGANISM_FAVORITE] }, ENTITY_TYPE.ORGANISM);

    expect(mockUseEntityLists).toHaveBeenLastCalledWith(["organisms"]);
  });

  test("loads no list when no organisms are saved", () => {
    // The organisms list is ~13MB; there is nothing to label without favorites.
    renderSection({ favorites: [] }, ENTITY_TYPE.ORGANISM);

    expect(mockUseEntityLists).toHaveBeenLastCalledWith([]);
  });

  test("loads no list to label saved assemblies, which show their accession", () => {
    renderSection();

    expect(mockUseEntityLists).toHaveBeenLastCalledWith([]);
  });
});
