import { ROUTES } from "@logan/routes/constants";
import { ATTRIBUTION } from "@site-config/logan-search/local/attribution";
import loganLocal, { makeConfig } from "@site-config/logan-search/local/config";

describe("Logan Search site config", () => {
  test("has no entity lists and lands on the search at the root", () => {
    // AppProviders and findable-ui's ConfigProvider fall back to the default
    // entity config only when both of these hold.
    expect(loganLocal.entities).toEqual([]);
    expect(loganLocal.redirectRootToPath).toBe("/");
  });

  test("keeps login off until the backend's auth flow is host-aware", () => {
    expect(makeConfig("https://example.org").loginEnabled).toBe(false);
  });

  test("links only to its own pages from the header", () => {
    const [, center] = loganLocal.layout.header.navigation ?? [];
    expect(center?.map(({ url }) => url)).toEqual([
      ROUTES.SEARCH,
      ROUTES.LEARN,
    ]);
  });

  test("shows no placeholder credits", () => {
    // These render in the footer of every page.
    for (const credit of Object.values(ATTRIBUTION)) {
      expect(credit).not.toMatch(/TBD|^\[/);
    }
  });
});
