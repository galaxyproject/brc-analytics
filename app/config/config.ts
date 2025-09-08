import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import brcAnalyticsDev from "../../site-config/brc-analytics/dev/config";
import brcAnalyticsLocal from "../../site-config/brc-analytics/local/config";
import brcAnalyticsProd from "../../site-config/brc-analytics/prod/config";
import ga2Dev from "../../site-config/ga2/dev/config";
import ga2Local from "../../site-config/ga2/local/config";
import ga2Prod from "../../site-config/ga2/prod/config";
import { AppSiteConfig } from "../../site-config/common/entities";

const CONFIGS: { [k: string]: AppSiteConfig } = {
  "brc-analytics-dev": brcAnalyticsDev,
  "brc-analytics-local": brcAnalyticsLocal,
  "brc-analytics-prod": brcAnalyticsProd,
  "ga2-dev": ga2Dev,
  "ga2-local": ga2Local,
  "ga2-prod": ga2Prod,
};

let appConfig: AppSiteConfig | null = null;

export const config = (): AppSiteConfig => {
  if (appConfig) {
    return appConfig;
  }

  const config = process.env.NEXT_PUBLIC_SITE_CONFIG;

  if (!config) {
    console.error(`Config not found. config: ${config}`);
  }

  appConfig = CONFIGS[config as string];

  if (!appConfig) {
    console.error(`No app config was found for the config: ${config}`);
  } else {
    console.log(`Using app config ${config}`);
  }

  setConfig(appConfig); // Sets app config.
  return appConfig;
};
