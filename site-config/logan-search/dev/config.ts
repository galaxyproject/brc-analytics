import { type AppSiteConfig } from "@repo/shared/config/types";
import { makeConfig } from "@site-config/logan-search/local/config";

// Placeholder: the interim BRC-owned hostname isn't chosen yet.
const BROWSER_URL = "https://logan.dev.brc-analytics.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
