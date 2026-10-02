import { type Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { ROUTES } from "@repo/shared/routes/constants";

/**
 * Returns the site config with the header navigation gated by the runtime
 * feature flags: the Genes entry is removed unless gene pages are enabled.
 * @param appConfig - Site config.
 * @param genePagesEnabled - Whether the gene pages feature flag is set.
 * @returns site config to render with.
 */
export function getAppConfig(
  appConfig: AppSiteConfig,
  genePagesEnabled: boolean
): AppSiteConfig {
  if (genePagesEnabled) return appConfig;
  return removeHeaderLinks(appConfig, ROUTES.GENES);
}

/**
 * Returns the site config with links to the given URL removed from the header
 * navigation.
 * @param appConfig - Site config.
 * @param url - URL of the links to remove.
 * @returns site config without those header links.
 */
function removeHeaderLinks(
  appConfig: AppSiteConfig,
  url: string
): AppSiteConfig {
  const { layout } = appConfig;
  const { navigation } = layout.header;
  if (!navigation) return appConfig;
  return {
    ...appConfig,
    layout: {
      ...layout,
      header: {
        ...layout.header,
        navigation: navigation.map(
          (links) => links && removeLinks(links, url)
        ) as Navigation,
      },
    },
  };
}

/**
 * Removes links with the given URL from a list of links, including from any
 * nested menu items.
 * @param links - Navigation links.
 * @param url - URL of the links to remove.
 * @returns links without those pointing at the URL.
 */
function removeLinks<T extends NavLinkItem>(links: T[], url: string): T[] {
  return links
    .filter((link) => link.url !== url)
    .map((link) =>
      link.menuItems
        ? { ...link, menuItems: removeLinks(link.menuItems, url) }
        : link
    );
}
