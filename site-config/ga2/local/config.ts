import {
  type GA2AssemblyEntity,
  type GA2OrganismEntity,
} from "@/apis/catalog/ga2/entities";
import * as C from "@/components";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { type EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { Branding } from "@ga2/components/layout/Branding/branding";
import { ROUTES } from "@repo/shared/routes/constants";
import { ROUTES as SITE_ROUTES } from "@routes/constants";
import { APP_KEYS } from "@site-config/common/constants";
import { type AppSiteConfig } from "@site-config/common/entities";
import { SUPPORT_URL } from "./constants";
import { floating } from "./floating/floating";
import { genomeEntityConfig } from "./index/genome/genomeEntityConfig";
import { organismEntityConfig } from "./index/organism/organismEntityConfig";
import { type WorkflowEntity } from "./index/workflow/types";
import { workflowEntityConfig } from "./index/workflow/workflowEntityConfig";
import { socialMedia } from "./socialMedia";
import { THEME_OPTIONS } from "./theme/constants";

const ALLOWED_PATHS = [
  SITE_ROUTES.ABOUT,
  SITE_ROUTES.ABOUT_PARTNER_RESOURCES,
  SITE_ROUTES.ABOUT_ROADMAP,
  ROUTES.ORGANISMS,
  ROUTES.GENOMES,
  ROUTES.WORKFLOWS,
];
const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "Genome Ark 2";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/ga2";

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @remarks
 * The `genomeEntityConfig` is typecast to `EntityConfig<GA2AssemblyEntity>`
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
  gitHubUrl = GIT_HUB_REPO_URL
): AppSiteConfig {
  return {
    allowedPaths: ALLOWED_PATHS,
    appKey: APP_KEYS.GA2,
    appTitle: APP_TITLE,
    browserURL: browserUrl,
    dataSource: {
      url: "",
    },
    entities: [
      organismEntityConfig as EntityConfig<GA2OrganismEntity>,
      genomeEntityConfig as EntityConfig<GA2AssemblyEntity>,
      workflowEntityConfig as EntityConfig<WorkflowEntity>,
    ],
    gitHubUrl,
    layout: {
      floating,
      footer: {
        Branding: Branding(),
        navLinks: [
          {
            label: "BRC Analytics",
            target: ANCHOR_TARGET.BLANK,
            url: "https://brc-analytics.org/",
          },
        ],
        socials: socialMedia.socials,
        versionInfo: true,
      },
      header: {
        logo: C.Logo({
          alt: APP_TITLE,
          height: 28,
          link: "/",
          src: "/logo/ga2.svg",
        }),
        navigation: [
          undefined,
          [
            { label: "About", url: SITE_ROUTES.ABOUT },
            { label: "Organisms", url: ROUTES.ORGANISMS },
            { label: "Assemblies", url: ROUTES.GENOMES },
            { label: "Workflows", url: ROUTES.WORKFLOWS },
          ],
          undefined,
        ],
      },
    },
    maxReadRunsForBrowseAll: 80000,
    redirectRootToPath: "/",
    supportUrl: SUPPORT_URL,
    themeOptions: THEME_OPTIONS,
  };
}

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
