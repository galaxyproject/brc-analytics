import { createConfig } from "@repo/shared/config/createConfig";
import { ENVIRONMENT } from "@repo/shared/config/environment";
import ga2Dev from "@site-config/ga2/dev/config";
import ga2Local from "@site-config/ga2/local/config";
import ga2Prod from "@site-config/ga2/prod/config";

/**
 * Resolves the site config for the active environment.
 * @returns app site config.
 */
export const config = createConfig({
  [ENVIRONMENT.DEV]: ga2Dev,
  [ENVIRONMENT.LOCAL]: ga2Local,
  [ENVIRONMENT.PROD]: ga2Prod,
});
