import { makeConfig } from "../local/config";
import { AppSiteConfig } from "../../common/entities";

const BROWSER_URL = "https://brc-analytics.dev.clevercanary.com";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
