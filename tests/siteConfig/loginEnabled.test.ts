import { BRC_DATA_CATALOG_CATEGORY_KEY } from "../../site-config/brc-analytics/category";
import brcConfig, {
  makeConfig,
} from "../../site-config/brc-analytics/local/config";
import ga2Config from "../../site-config/ga2/local/config";

// The brc config chain pulls in FavoriteButton -> the favorites provider ->
// the real api-client -> ky, an ESM-only package Jest can't parse. Stub it
// out, as the sibling favorite-component tests do; nothing here calls it.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    getFavorites: jest.fn(),
  },
}));

// The priority-pathogens entity config wires in MDXSection, which pulls in
// next-mdx-remote -- another ESM-only package Jest can't parse. Stub it;
// this suite never renders it.
jest.mock(
  "../../sites/brc-analytics/views/PriorityPathogenView/ui/Section/MDXSection/mdxSection",
  () => ({
    MDXSection: (): null => null,
  })
);

const BROWSER_URL = "http://localhost:3000";

/**
 * Finds the column ids configured for one entity's list table.
 * @param config - Site config produced by makeConfig.
 * @param route - Entity route to look up ("assemblies" or "organisms").
 * @returns the column ids configured for that entity's list.
 */
function listColumnIds(
  config: ReturnType<typeof makeConfig>,
  route: string
): string[] {
  const entityConfig = config.entities.find((entity) => entity.route === route);
  if (!entityConfig) {
    throw new Error(`No entity config found for route "${route}"`);
  }
  return entityConfig.list.columns.map((column) => column.id);
}

describe("loginEnabled site config", () => {
  test("ga2 does not enable login, so no account UI can render there", () => {
    expect(ga2Config.loginEnabled).toBe(false);
  });

  test("brc exposes loginEnabled so the account UI can be gated on it", () => {
    expect(typeof brcConfig.loginEnabled).toBe("boolean");
  });
});

describe("SAVED column gating", () => {
  test.each([["assemblies"], ["organisms"]])(
    "includes the SAVED column for %s when login is enabled",
    (route) => {
      const config = makeConfig(BROWSER_URL, undefined, true);
      expect(listColumnIds(config, route)).toContain(
        BRC_DATA_CATALOG_CATEGORY_KEY.SAVED
      );
    }
  );

  test.each([["assemblies"], ["organisms"]])(
    "omits the SAVED column for %s when login is disabled",
    (route) => {
      const config = makeConfig(BROWSER_URL, undefined, false);
      expect(listColumnIds(config, route)).not.toContain(
        BRC_DATA_CATALOG_CATEGORY_KEY.SAVED
      );
    }
  );
});
