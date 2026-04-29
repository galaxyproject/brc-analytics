import { AppSiteConfig } from "../../common/entities";
import { makeConfig } from "../local/config";

const BROWSER_URL = "https://brc-analytics.org";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
