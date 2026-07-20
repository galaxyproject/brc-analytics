import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import { AppSiteConfig } from "@site-config/common/entities";
import brcAnalyticsDev from "./dev/config";
import brcAnalyticsLocal from "./local/config";
import brcAnalyticsProd from "./prod/config";

const CONFIGS: { [k: string]: AppSiteConfig } = {
  "brc-analytics-dev": brcAnalyticsDev,
  "brc-analytics-local": brcAnalyticsLocal,
  "brc-analytics-prod": brcAnalyticsProd,
};

const appConfig = CONFIGS[process.env.NEXT_PUBLIC_SITE_CONFIG as string];

// Register with findable-ui's config holder at module load so shared code's
// getConfig() is populated as soon as this site's _app or a page imports it.
setConfig(appConfig);

/**
 * Returns the BRC Analytics site config for the active environment.
 * @returns app site config.
 */
export const config = (): AppSiteConfig => appConfig;
