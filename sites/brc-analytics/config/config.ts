import { createConfig } from "@repo/shared/config/createConfig";
import brcDev from "@site-config/brc-analytics/dev/config";
import brcLocal from "@site-config/brc-analytics/local/config";
import brcProd from "@site-config/brc-analytics/prod/config";

/**
 * Resolves the site config for the active environment.
 * @returns app site config.
 */
export const config = createConfig({
  "brc-analytics-dev": brcDev,
  "brc-analytics-local": brcLocal,
  "brc-analytics-prod": brcProd,
});
