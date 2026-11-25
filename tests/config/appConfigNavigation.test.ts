import { useAppConfig } from "@brc/hooks/UseAppConfig/hook";
import { getAppConfig } from "@brc/hooks/UseAppConfig/utils";
import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { ROUTES } from "@repo/shared/routes/constants";
import { headerNavigation } from "@site-config/brc-analytics/local/navigation";
import { renderHook } from "@testing-library/react";

// The real site config imports next-mdx-remote, which Jest cannot parse. The
// path is relative because the `@brc` alias is resolved at compile time for
// imports, not for `jest.mock` paths.
jest.mock("../../sites/brc-analytics/config/config", () => ({
  config: (): AppSiteConfig => mockConfig,
}));

const mockConfig = buildConfig();

/**
 * Builds a minimal site config carrying only the header navigation.
 * @returns Site config with the full header navigation.
 */
function buildConfig(): AppSiteConfig {
  return {
    layout: { header: { navigation: headerNavigation(true) } },
  } as AppSiteConfig;
}

/**
 * Flattens a navigation link together with any links nested in its menu.
 * @param link - Navigation link.
 * @returns The link followed by its menu items, in display order.
 */
function flattenLink(link: NavLinkItem): { label: string; url: string }[] {
  return [
    { label: String(link.label), url: link.url },
    ...(link.menuItems ?? []).flatMap(flattenLink),
  ];
}

/**
 * Every header link in the config, flattened across nav groups and the menus
 * nested within them.
 * @param appConfig - Site config.
 * @returns Links in display order.
 */
function headerLinks(
  appConfig: AppSiteConfig
): { label: string; url: string }[] {
  return (appConfig.layout.header.navigation ?? []).flatMap((group) =>
    (group ?? []).flatMap(flattenLink)
  );
}

describe("getAppConfig", () => {
  it("returns the config unchanged when the demo flag is set", () => {
    const appConfig = buildConfig();
    expect(getAppConfig(appConfig, true)).toBe(appConfig);
  });

  it("removes every Genes link when the demo flag is unset", () => {
    const links = headerLinks(getAppConfig(buildConfig(), false));
    expect(links.filter(({ url }) => url === ROUTES.GENES)).toEqual([]);
  });

  it("keeps every other link, in order, when the demo flag is unset", () => {
    const appConfig = buildConfig();
    const expected = headerLinks(appConfig).filter(
      ({ url }) => url !== ROUTES.GENES
    );
    expect(headerLinks(getAppConfig(appConfig, false))).toEqual(expected);
  });

  it("does not mutate the original config", () => {
    const appConfig = buildConfig();
    getAppConfig(appConfig, false);
    const genesLinks = headerLinks(appConfig).filter(
      ({ url }) => url === ROUTES.GENES
    );
    // Genes appears in the primary links and in the "More" menu.
    expect(genesLinks).toHaveLength(2);
  });

  it("returns the config unchanged when it has no header navigation", () => {
    const appConfig = { layout: { header: {} } } as AppSiteConfig;
    expect(getAppConfig(appConfig, false)).toBe(appConfig);
  });
});

describe("useAppConfig", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the Genes links when the demo flag is set", () => {
    window.localStorage.setItem(FEATURE_FLAGS.DEMO, "true");
    const { result } = renderHook(() => useAppConfig());
    const urls = headerLinks(result.current).map(({ url }) => url);
    expect(urls).toContain(ROUTES.GENES);
  });

  it("hides the Genes links when the demo flag is unset", () => {
    const { result } = renderHook(() => useAppConfig());
    const urls = headerLinks(result.current).map(({ url }) => url);
    expect(urls).not.toContain(ROUTES.GENES);
  });
});
