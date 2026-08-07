import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { useEffect, useState } from "react";

/**
 * Kicks off the one-time entity/workflow cache load and returns whether it has
 * finished, so consumers share a single load state. The site supplies its own
 * loader, keeping the hook agnostic of which entities and workflows are loaded.
 * @param ensureEntitiesLoaded - Loader that resolves once the site's entities
 * and workflows are loaded.
 * @returns Whether the entities and workflows have finished loading.
 */
export function useEntities(
  ensureEntitiesLoaded: (config: SiteConfig) => Promise<void>
): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  const config = getConfig();

  useEffect(() => {
    if (!config) return;

    ensureEntitiesLoaded(config)
      .then(() => setIsLoaded(true))
      .catch((err) => {
        throw new Error(`Failed to load entities: ${err}`);
      });
  }, [config, ensureEntitiesLoaded]);

  return isLoaded;
}
