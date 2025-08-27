import { makeConfig } from "../local/config";
import { AppSiteConfig } from "../../common/entities";

const BROWSER_URL = "https://brc-analytics.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
