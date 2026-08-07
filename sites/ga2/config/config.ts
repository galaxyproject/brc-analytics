import { createConfig } from "@repo/shared/config/createConfig";
import ga2Dev from "@site-config/ga2/dev/config";
import ga2Local from "@site-config/ga2/local/config";
import ga2Prod from "@site-config/ga2/prod/config";

/**
 * Resolves the site config for the active environment.
 * @returns app site config.
 */
export const config = createConfig({
  "ga2-dev": ga2Dev,
  "ga2-local": ga2Local,
  "ga2-prod": ga2Prod,
});
