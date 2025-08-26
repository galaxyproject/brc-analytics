import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { makeConfig } from "../local/config";

const BROWSER_URL = "https://brc-analytics.org";

const config: SiteConfig = makeConfig(BROWSER_URL);

export default config;
