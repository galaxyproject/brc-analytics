import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../app/components";
import { ROUTES } from "../../../routes/constants";
import { genomeEntityConfig } from "./index/genome/genomeEntityConfig";
import { organismEntityConfig } from "./index/organism/organismEntityConfig";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../app/apis/catalog/ga2/entities";

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
): SiteConfig {
  return {
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
        versionInfo: true,
      },
      header: {
        logo: C.Logo({
          alt: APP_TITLE,
          height: 26,
          link: "/",
          src: "/logo/galaxy.png",
        }),
        navigation: [
          undefined,
          [
            { label: "Organisms", url: ROUTES.ORGANISMS },
            { label: "Assemblies", url: ROUTES.GENOMES },
          ],
          undefined,
        ],
      },
    },
    redirectRootToPath: "/",
    themeOptions: {},
  };
}

const config: SiteConfig = makeConfig(BROWSER_URL);

export default config;
