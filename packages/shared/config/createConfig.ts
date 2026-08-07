import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";

/**
 * Builds a site config resolver from a set of environment-keyed configs.
 * Resolves the config for the active NEXT_PUBLIC_SITE_CONFIG on first call,
 * caches it, and registers it with findable-ui's config holder via setConfig so
 * shared code's getConfig() is populated. Throws if NEXT_PUBLIC_SITE_CONFIG is
 * unset or does not match a provided config, failing fast with an actionable
 * message rather than returning an undefined config.
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
      throw new Error(
        "NEXT_PUBLIC_SITE_CONFIG is not set; cannot resolve the site config."
      );
    }

    const resolved = configs[config];

    if (!resolved) {
      throw new Error(
        `No site config found for NEXT_PUBLIC_SITE_CONFIG "${config}".`
      );
    }

    appConfig = resolved;
    setConfig(appConfig); // Register the resolved config with findable-ui.
    console.log(`Using app config ${config}`);
    return appConfig;
  };
}
