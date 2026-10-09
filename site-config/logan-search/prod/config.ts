import { type AppSiteConfig } from "@repo/shared/config/types";
import { makeConfig } from "@site-config/logan-search/local/config";

// Placeholder: the site moves to logan-search.org only at the DNS handoff, and
// the interim BRC-owned hostname isn't chosen yet.
const BROWSER_URL = "https://logan-search.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
