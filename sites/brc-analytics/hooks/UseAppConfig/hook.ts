import { config } from "@brc/config/config";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { useMemo } from "react";
import { getAppConfig } from "./utils";

/**
 * Returns the site config with the header navigation gated by the runtime
 * feature flags (e.g. Genes shows only when `?gene-pages=true` has been set).
 * The flag reads false on the server and during hydration, so flagged entries
 * appear only once the client has hydrated.
 * @returns site config to render with.
 */
export function useAppConfig(): AppSiteConfig {
  const appConfig = config();
  const genePagesEnabled = useFeatureFlag(FEATURE_FLAGS.GENE_PAGES);
  return useMemo(
    () => getAppConfig(appConfig, genePagesEnabled),
    [appConfig, genePagesEnabled]
  );
}
