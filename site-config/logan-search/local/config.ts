import { SELECTED_MATCH } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { Logo } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Logo/logo";
import { Branding } from "@logan/components/layout/Branding/branding";
import { ROUTES } from "@logan/routes/constants";
import { type AppSiteConfig } from "@repo/shared/config/types";

const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "Logan Search";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/brc-analytics";

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @remarks
 * The site has no entity lists, so `entities` is empty and
 * `redirectRootToPath` is "/": findable-ui then falls back to its default
 * entity config instead of looking one up by name.
 *
 * @returns site config.
 */
export function makeConfig(
  browserUrl: string,
  gitHubUrl = GIT_HUB_REPO_URL
): AppSiteConfig {
  return {
    appTitle: APP_TITLE,
    browserURL: browserUrl,
    dataSource: {
      url: "",
    },
    entities: [],
    gitHubUrl,
    layout: {
      footer: {
        Branding: Branding(),
        versionInfo: true,
      },
      header: {
        logo: Logo({
          alt: APP_TITLE,
          height: 28,
          link: ROUTES.SEARCH,
          src: "/logo/logan-search.svg",
        }),
        navigation: [
          undefined,
          [
            // Exact: findable-ui matches nav items by prefix, and "/" is a
            // prefix of every page.
            {
              label: "Search",
              selectedMatch: SELECTED_MATCH.EQUALS,
              url: ROUTES.SEARCH,
            },
            { label: "Learn", url: ROUTES.LEARN },
          ],
          undefined,
        ],
      },
    },
    // The backend's login flow is tied to the BRC host (redirect URI, post-login
    // URL and a host-only session cookie), so login here would land people back
    // on brc-analytics.org. Searches run anonymously until that's host-aware.
    loginEnabled: false,
    maxReadRunsForBrowseAll: 0,
    redirectRootToPath: "/",
  };
}

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
