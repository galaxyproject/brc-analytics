import { makeConfig } from "@site-config/brc-analytics/local/config";
import { type AppSiteConfig } from "@site-config/common/entities";

const BROWSER_URL = "https://brc-analytics.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
