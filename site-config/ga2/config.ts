import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import { AppSiteConfig } from "@site-config/common/entities";
import ga2Dev from "./dev/config";
import ga2Local from "./local/config";
import ga2Prod from "./prod/config";

const CONFIGS: { [k: string]: AppSiteConfig } = {
  "ga2-dev": ga2Dev,
  "ga2-local": ga2Local,
  "ga2-prod": ga2Prod,
};

const appConfig = CONFIGS[process.env.NEXT_PUBLIC_SITE_CONFIG as string];

// Register with findable-ui's config holder at module load so shared code's
// getConfig() is populated as soon as this site's _app or a page imports it.
setConfig(appConfig);

/**
 * Returns the GA2 site config for the active environment.
 * @returns app site config.
 */
export const config = (): AppSiteConfig => appConfig;
