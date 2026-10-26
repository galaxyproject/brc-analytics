import { type AppSiteConfig } from "@repo/shared/config/types";
import { makeConfig } from "@site-config/logan-search/local/config";

// The BRC-owned interim name; logan-search.org replaces it at the DNS handoff.
const BROWSER_URL = "https://logan.brc-analytics.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
