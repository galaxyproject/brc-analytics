import { type AppSiteConfig } from "@repo/shared/config/types";
import { makeConfig } from "@site-config/ga2/local/config";

const BROWSER_URL = "https://ga2.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
