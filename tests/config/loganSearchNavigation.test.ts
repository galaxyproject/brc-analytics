import { ROUTES } from "@brc/routes/constants";
import { headerNavigation } from "@site-config/brc-analytics/local/navigation";

/**
 * Every header link the config declares, flattened across nav groups.
 * @param loganSearchEnabled - The build flag under test.
 * @returns Links in display order.
 */
function headerLinks(
  loganSearchEnabled: boolean
): { label: string; url: string }[] {
  return headerNavigation(loganSearchEnabled).flatMap((group) =>
    (group ?? []).map((link) => ({ label: String(link.label), url: link.url }))
  );
}

/**
 * Every header link URL the config declares, flattened across nav groups.
 * @param loganSearchEnabled - The build flag under test.
 * @returns Link URLs in display order.
 */
function headerUrls(loganSearchEnabled: boolean): string[] {
  return headerLinks(loganSearchEnabled).map((link) => link.url);
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

  test("is labelled Logan Search, immediately after Workflows", () => {
    // The label is what people navigate by, and the entry is inserted rather
    // than appended -- both are worth pinning, since neither shows up in a URL
    // assertion.
    const links = headerLinks(true);
    const index = links.findIndex((link) => link.url === ROUTES.LOGAN_SEARCH);

    expect(links[index].label).toBe("Logan Search");
    expect(links[index - 1].label).toBe("Workflows");
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
