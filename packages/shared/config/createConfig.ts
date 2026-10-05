import { setConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type Environment, getEnvironment } from "./environment";

/**
 * Builds a site config resolver from a set of environment-keyed configs.
 * Resolves the config for the active environment (getEnvironment) on first
 * call, caches it, and registers it with findable-ui's config holder via
 * setConfig so shared code's getConfig() is populated.
 * @param configs - Site configs keyed by environment.
 * @returns function returning the active site config.
 */
export function createConfig<T extends SiteConfig>(
  configs: Record<Environment, T>
): () => T {
  let appConfig: T | null = null;

  return (): T => {
    if (appConfig) {
      return appConfig;
    }

    const environment = getEnvironment();
    const resolved = configs[environment];

    // Runtime backstop for the compile-time Record exhaustiveness — a missing
    // entry would otherwise poison findable-ui's config holder with undefined.
    if (!resolved) {
      throw new Error(`No site config found for environment "${environment}".`);
    }

    appConfig = resolved;
    setConfig(appConfig); // Register the resolved config with findable-ui.
    console.log(`Using site config for environment "${environment}"`);
    return appConfig;
  };
}
