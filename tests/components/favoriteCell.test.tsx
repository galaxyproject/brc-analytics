import { FavoriteCell } from "@repo/shared/components/Favorites/components/FavoriteCell/favoriteCell";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import { useFavorites } from "@repo/shared/providers/favorites/provider";
import { fireEvent, render, screen } from "@testing-library/react";
// jest-dom matchers (toBeEmptyDOMElement, toBeDisabled) aren't registered
// globally in this repo's jest config; opt in locally as the sibling
// FavoriteButton suite does.
import "@testing-library/jest-dom";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));
// Only useFavorites is stubbed -- favoriteKey stays real, so a break in the
// key format fails this test instead of hiding behind a reimplementation.
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

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFavorites = useFavorites as jest.MockedFunction<
  typeof useFavorites
>;

const ACCESSION = "GCF_000001405.40";
const TAXONOMY_ID = "5833";

function setFavorites(overrides = {}): jest.Mock {
  const toggleFavorite = jest.fn();
  mockUseFavorites.mockReturnValue({
    error: null,
    favorites: [],
    isFavorited: () => false,
    isLoading: false,
    isToggling: false,
    toggleFavorite,
    togglingKey: null,
    ...overrides,
  } as unknown as ReturnType<typeof useFavorites>);
  return toggleFavorite;
}

describe("FavoriteCell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
      isLoading: false,
      login: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  test("renders nothing when login is not configured", () => {
    setFavorites();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: false,
      isLoading: false,
      login: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    const { container } = render(
      <FavoriteCell entityId={ACCESSION} entityType={ENTITY_TYPE.ASSEMBLY} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test("toggles an assembly row", () => {
    const toggleFavorite = setFavorites();

    render(
      <FavoriteCell entityId={ACCESSION} entityType={ENTITY_TYPE.ASSEMBLY} />
    );
    fireEvent.click(screen.getByRole("button"));

    expect(toggleFavorite).toHaveBeenCalledWith("assembly", ACCESSION);
  });

  test("toggles an organism row", () => {
    const toggleFavorite = setFavorites();

    render(
      <FavoriteCell entityId={TAXONOMY_ID} entityType={ENTITY_TYPE.ORGANISM} />
    );
    fireEvent.click(screen.getByRole("button"));

    expect(toggleFavorite).toHaveBeenCalledWith("organism", TAXONOMY_ID);
  });

  test("labels the control by saved state", () => {
    setFavorites({ isFavorited: () => true });

    render(
      <FavoriteCell entityId={ACCESSION} entityType={ENTITY_TYPE.ASSEMBLY} />
    );

    expect(
      screen.getByRole("button", { name: /remove .* from saved/i })
    ).toBeInTheDocument();
  });

  test("disables only the row being toggled", () => {
    setFavorites({ isToggling: true, togglingKey: "assembly:SOME_OTHER" });

    render(
      <FavoriteCell entityId={ACCESSION} entityType={ENTITY_TYPE.ASSEMBLY} />
    );

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  test("prompts sign-in instead of toggling when signed out", () => {
    const toggleFavorite = setFavorites();
    const login = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: false,
      login,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <FavoriteCell entityId={ACCESSION} entityType={ENTITY_TYPE.ASSEMBLY} />
    );
    fireEvent.click(screen.getByRole("button"));

    expect(login).toHaveBeenCalled();
    expect(toggleFavorite).not.toHaveBeenCalled();
  });
});
