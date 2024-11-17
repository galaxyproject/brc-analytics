import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { EntityConfig } from "@databiosphere/findable-ui/src/config/entities";
import { BRCDataCatalogGenome } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../app/components";
import { ROUTES } from "../../../routes/constants";
import { floating } from "./floating/floating";
import { genomeEntityConfig } from "./index/genomeEntityConfig";
import { socialMedia } from "./socialMedia";

const LOCALHOST = "http://localhost:3000";
const APP_TITLE = "BRC Analytics";
const BROWSER_URL = LOCALHOST;
const GIT_HUB_REPO_URL = "https://github.com/galaxyproject/brc-analytics";

/**
 * Make site config object.
 * @param browserUrl - Browser URL.
 * @param gitHubUrl - GitHub URL.
 * @remarks
 * The `genomeEntityConfig` is typecast to `EntityConfig<BRCDataCatalogGenome>`
 * because the `SiteConfig` interface from the `@databiosphere/findable-ui` package expects
 * an array of entities typed as `EntityConfig`, but we have modified the EntityConfig
 * locally with a custom `BRCEntityConfig` entity. To avoid rewriting
 * the associated functions and providers across the codebase due to this modification,
 * we perform a type cast here. This allows us to retain compatibility with the existing
 * `SiteConfig` structure while accommodating the modified entity configuration.
 *
 * @returns site config.
 */
export function makeConfig(browserUrl: string, gitHubUrl: string): SiteConfig {
  return {
    appTitle: APP_TITLE,
    browserURL: browserUrl,
    dataSource: {
      url: "",
    },
    entities: [genomeEntityConfig as EntityConfig<BRCDataCatalogGenome>],
    explorerTitle: APP_TITLE,
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
        versionInfo: true,
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
            { label: "Datasets", url: ROUTES.GENOMES },
            { label: "Roadmap", url: ROUTES.ROADMAP },
          ],
          undefined,
        ],
        socialMedia: socialMedia,
      },
    },
    redirectRootToPath: "/",
    themeOptions: {},
  };
}

const config: SiteConfig = makeConfig(BROWSER_URL, GIT_HUB_REPO_URL);

export default config;
