import { ROUTES } from "@brc/routes/constants";
import { headerNavigation } from "@site-config/brc-analytics/local/navigation";

/**
 * Every header link URL the config declares, flattened across nav groups.
 * @param loganSearchEnabled - The build flag under test.
 * @returns Link URLs in display order.
 */
function headerUrls(loganSearchEnabled: boolean): string[] {
  return headerNavigation(loganSearchEnabled).flatMap((group) =>
    (group ?? []).map((link) => link.url)
  );
}

describe("Logan Search in the header", () => {
  test("is linked when the build flag is on", () => {
    const urls = headerUrls(true);
    expect(urls).toContain(ROUTES.LOGAN_SEARCH);
    // After Workflows: it is an analysis entry point, not a catalog listing.
    expect(urls.indexOf(ROUTES.LOGAN_SEARCH)).toBe(
      urls.indexOf("/data/workflows") + 1
    );
  });

  test("is absent when the build flag is off", () => {
    // Production has no Galaxy key and no mirror; a link there lands on a
    // page whose first request 503s.
    expect(headerUrls(false)).not.toContain(ROUTES.LOGAN_SEARCH);
  });

  test("the route constant is the page's path", () => {
    expect(ROUTES.LOGAN_SEARCH).toBe("/logan-search");
  });
});
