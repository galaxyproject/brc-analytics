import { type AppSiteConfig } from "@repo/shared/config/types";
import { makeConfig } from "@site-config/brc-analytics/local/config";

const BROWSER_URL = "https://brc-analytics.dev.clevercanary.com";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
