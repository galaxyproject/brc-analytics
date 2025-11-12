import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../app/components";
import { ROUTES } from "../../../routes/constants";
import { genomeEntityConfig } from "./index/genome/genomeEntityConfig";
import { organismEntityConfig } from "./index/organism/organismEntityConfig";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../app/apis/catalog/ga2/entities";
import { AppSiteConfig } from "../../common/entities";
import { APP_KEYS } from "../../common/constants";
import data from "catalog/ga2/output/ncbi-taxa-tree.json";
import { socialMedia } from "./socialMedia";
import { TaxonomyNode } from "../../../app/components/Home/components/Section/components/SectionViz/data";
import { THEME_OPTIONS } from "./theme/constants";

const ALLOWED_PATHS = [
  ROUTES.ABOUT,
  ROUTES.ORGANISMS,
  ROUTES.GENOMES,
  // ROUTES.ROADMAP,
];
const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "Genome Ark 2";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/ga2";

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @param taxTreeData - Taxonomy tree data.
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
  gitHubUrl = GIT_HUB_REPO_URL,
  taxTreeData = data as TaxonomyNode
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
    ],
    gitHubUrl,
    layout: {
      footer: {
        Branding: C.GA2Branding(),
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
            { label: "About", url: ROUTES.ABOUT },
            { label: "Organisms", url: ROUTES.ORGANISMS },
            { label: "Assemblies", url: ROUTES.GENOMES },
            // { label: "Roadmap", url: ROUTES.ROADMAP },
          ],
          undefined,
        ],
      },
    },
    maxReadRunsForBrowseAll: 4000,
    redirectRootToPath: "/",
    taxTree: taxTreeData,
    themeOptions: THEME_OPTIONS,
  };
}

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
