import { makeConfig } from "../local/config";
import { AppSiteConfig } from "../../common/entities";

const BROWSER_URL = "https://ga2.dev.clevercanary.com";

const config: AppSiteConfig = makeConfig(BROWSER_URL);

export default config;
