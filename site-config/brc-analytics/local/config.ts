import { type BRCDataCatalogGenome } from "@brc/apis/assembly";
import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { type Outbreak } from "@brc/apis/outbreak";
import { AuthButton } from "@brc/components/layout/AuthButton/authButton";
import { Branding } from "@brc/components/layout/Branding/branding";
import { VersionInfoWithServerStatus } from "@brc/components/layout/VersionInfoWithServerStatus/versionInfoWithServerStatus";
import { ROUTES as SITE_ROUTES } from "@brc/routes/constants";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { Logo } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Logo/logo";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { type EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  type AppEntityConfig,
  type AppSiteConfig,
} from "@repo/shared/config/types";
import { ROUTES } from "@repo/shared/routes/constants";
import { BRC_DATA_CATALOG_CATEGORY_KEY } from "@site-config/brc-analytics/category";
import { createElement } from "react";
import { SUPPORT_URL } from "./constants";
import { floating } from "./floating/floating";
import { genomeEntityConfig } from "./index/genomeEntityConfig";
import { organismEntityConfig } from "./index/organismEntityConfig";
import { priorityPathogensEntityConfig } from "./index/priorityPathogensEntityConfig";
import { type WorkflowEntity } from "./index/workflow/types";
import { workflowEntityConfig } from "./index/workflowEntityConfig";
import { socialMedia } from "./socialMedia";

const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "BRC Analytics";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/brc-analytics";

// Login UI is gated by a build-time env var so deployments (the playbook) flip
// it per environment without an app-code change. Defaults off when unset.
const LOGIN_ENABLED = process.env.NEXT_PUBLIC_LOGIN_ENABLED === "true";

/**
 * Removes the SAVED column from an entity's list config when login is
 * disabled. FavoriteCell itself already renders nothing without login, but
 * the column header, its grid track, and its entry in the column-visibility
 * menu are static config and would otherwise ship regardless.
 * @param entityConfig - Entity config to gate.
 * @param loginEnabled - Whether login (and so the SAVED column) is enabled.
 * @returns entityConfig unchanged when loginEnabled is true, otherwise with
 * the SAVED column filtered out of list.columns.
 */
function withSavedColumnGated<T>(
  entityConfig: AppEntityConfig<T>,
  loginEnabled: boolean
): AppEntityConfig<T> {
  if (loginEnabled) return entityConfig;
  return {
    ...entityConfig,
    list: {
      ...entityConfig.list,
      columns: entityConfig.list.columns.filter(
        (column) => column.id !== BRC_DATA_CATALOG_CATEGORY_KEY.SAVED
      ),
    },
  };
}

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @param loginEnabled - Whether to show the login button.
 * @remarks
 * The `genomeEntityConfig` is typecast to `EntityConfig<BRCDataCatalogGenome>`
 * because the `SiteConfig` interface from the `@databiosphere/findable-ui` package expects
 * an array of entities typed as `EntityConfig`, but we have modified the EntityConfig
 * locally with a custom `AppEntityConfig` entity. To avoid rewriting
 * the associated functions and providers across the codebase due to this modification,
 * we perform a type cast here. This allows us to retain compatibility with the existing
 * `SiteConfig` structure while accommodating the modified entity configuration.
 *
 * @returns site config.
 */
export function makeConfig(
  browserUrl: string,
  gitHubUrl = GIT_HUB_REPO_URL,
  loginEnabled = LOGIN_ENABLED
): AppSiteConfig {
  return {
    appTitle: APP_TITLE,
    browserURL: browserUrl,
    dataSource: {
      url: "",
    },
    entities: [
      withSavedColumnGated(
        organismEntityConfig,
        loginEnabled
      ) as EntityConfig<BRCDataCatalogOrganism>,
      withSavedColumnGated(
        genomeEntityConfig,
        loginEnabled
      ) as EntityConfig<BRCDataCatalogGenome>,
      priorityPathogensEntityConfig as EntityConfig<Outbreak>,
      workflowEntityConfig as EntityConfig<WorkflowEntity>,
    ],
    filterSort: { sortBy: FILTER_SORT.ALPHA },
    gitHubUrl,
    layout: {
      floating,
      footer: {
        Branding: Branding(),
        navLinks: [
          {
            label: "BV-BRC",
            target: ANCHOR_TARGET.BLANK,
            url: "https://www.bv-brc.org/",
          },
          {
            label: "Pathogen Data Network",
            target: ANCHOR_TARGET.BLANK,
            url: "https://pathogendatanetwork.org/",
          },
        ],
        socials: socialMedia.socials,
        versionInfo: createElement(VersionInfoWithServerStatus),
      },
      header: {
        actions: loginEnabled ? createElement(AuthButton) : undefined,
        logo: Logo({
          alt: APP_TITLE,
          height: 26,
          link: "/",
          src: "/logo/brc.svg",
        }),
        navigation: [
          undefined,
          [
            { label: "About", url: SITE_ROUTES.ABOUT },
            { label: "Learn", url: SITE_ROUTES.LEARN },
            { label: "Organisms", url: ROUTES.ORGANISMS },
            { label: "Assemblies", url: ROUTES.GENOMES },
            { label: "Workflows", url: ROUTES.WORKFLOWS },
            {
              label: "Priority Pathogens",
              url: SITE_ROUTES.PRIORITY_PATHOGENS,
            },
            { label: "Assistant", url: SITE_ROUTES.ASSISTANT },
          ],
          undefined,
        ],
        socialMedia: socialMedia,
      },
    },
    loginEnabled,
    maxReadRunsForBrowseAll: 80000,
    redirectRootToPath: "/",
    supportUrl: SUPPORT_URL,
  };
}

const config: AppSiteConfig = makeConfig(BROWSER_URL, GIT_HUB_REPO_URL, true);

export default config;
