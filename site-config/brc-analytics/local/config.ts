import { createElement } from "react";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  Outbreak,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../app/components";
import { ROUTES } from "../../../routes/constants";
import { floating } from "./floating/floating";
import { genomeEntityConfig } from "./index/genomeEntityConfig";
import { organismEntityConfig } from "./index/organismEntityConfig";
import { priorityPathogensEntityConfig } from "./index/priorityPathogensEntityConfig";
import { socialMenuItems, socialMedia } from "./socialMedia";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { AppSiteConfig } from "../../common/entities";
import { APP_KEYS } from "../../common/constants";
import data from "catalog/output/ncbi-taxa-tree.json";
import { TaxonomyNode } from "../../../app/components/Home/components/Section/components/SectionViz/data";
import { THEME_OPTIONS } from "./theme/constants";

const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "BRC Analytics";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/brc-analytics";

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @param taxTreeData - Taxonomy tree data.
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
  taxTreeData = data as TaxonomyNode
): AppSiteConfig {
  return {
    appKey: APP_KEYS.BRC_ANALYTICS,
    appTitle: APP_TITLE,
    browserURL: browserUrl,
    dataSource: {
      url: "",
    },
    entities: [
      organismEntityConfig as EntityConfig<BRCDataCatalogOrganism>,
      genomeEntityConfig as EntityConfig<BRCDataCatalogGenome>,
      priorityPathogensEntityConfig as EntityConfig<Outbreak>,
    ],
    filterSort: { sortBy: FILTER_SORT.ALPHA },
    gitHubUrl,
    layout: {
      floating,
      footer: {
        Branding: C.Branding(),
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
        versionInfo: createElement(C.VersionInfoWithServerStatus),
      },
      header: {
        logo: C.Logo({
          alt: APP_TITLE,
          height: 26,
          link: "/",
          src: "/logo/brc.svg",
        }),
        navigation: [
          undefined,
          [
            { label: "About", url: ROUTES.ABOUT },
            { label: "Learn", url: ROUTES.LEARN },
            { label: "Organisms", url: ROUTES.ORGANISMS },
            { label: "Assemblies", url: ROUTES.GENOMES },
            { label: "Priority Pathogens", url: ROUTES.PRIORITY_PATHOGENS },
            {
              flatten: { lg: true, md: true, sm: false, xs: true },
              label: "More",
              menuItems: [
                { label: "Roadmap", url: ROUTES.ROADMAP },
                {
                  label: "Join Us",
                  menuItems: socialMenuItems,
                  url: "",
                  visible: { lg: false, xs: false },
                },
              ],
              url: "",
            },
          ],
          undefined,
        ],
        socialMedia: socialMedia,
      },
    },
    maxReadRunsForBrowseAll: 60000,
    redirectRootToPath: "/",
    taxTree: taxTreeData,
    themeOptions: THEME_OPTIONS,
  };
}

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
