import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";

/**
 * Builds a site config resolver from a set of environment-keyed configs.
 * Resolves the config for the active NEXT_PUBLIC_SITE_CONFIG on first call,
 * caches it, and registers it with findable-ui's config holder via setConfig so
 * shared code's getConfig() is populated.
 * @param configs - Site configs keyed by environment (NEXT_PUBLIC_SITE_CONFIG).
 * @returns function returning the active site config.
 */
export function createConfig<T extends SiteConfig>(
  configs: Record<string, T>
): () => T {
  let appConfig: T | null = null;

  return (): T => {
    if (appConfig) {
      return appConfig;
    }

    const config = process.env.NEXT_PUBLIC_SITE_CONFIG;

    if (!config) {
      console.error(`Config not found. config: ${config}`);
    }

    appConfig = configs[config as string];

    if (!appConfig) {
      console.error(`No app config was found for the config: ${config}`);
    } else {
      console.log(`Using app config ${config}`);
    }

    setConfig(appConfig); // Sets app config.
    return appConfig;
  };
}
