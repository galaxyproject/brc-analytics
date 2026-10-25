import { createConfig } from "@repo/shared/config/createConfig";
import { ENVIRONMENT } from "@repo/shared/config/environment";
import loganDev from "@site-config/logan-search/dev/config";
import loganLocal from "@site-config/logan-search/local/config";
import loganProd from "@site-config/logan-search/prod/config";

/**
 * Resolves the site config for the active environment.
 * @returns app site config.
 */
export const config = createConfig({
  [ENVIRONMENT.DEV]: loganDev,
  [ENVIRONMENT.LOCAL]: loganLocal,
  [ENVIRONMENT.PROD]: loganProd,
});
