import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { loadEntities, loadWorkflows } from "../../loader";

let loadPromise: Promise<void> | null = null;

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export function ensureEntitiesLoaded(config: SiteConfig): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<void> => {
    await loadWorkflows();
    await loadEntities(config);
  })();

  return loadPromise;
}
