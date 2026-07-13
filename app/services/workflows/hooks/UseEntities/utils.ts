import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { loadEntities, loadPangenomes, loadWorkflows } from "../../loader";

let loadPromise: Promise<void> | null = null;

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export function ensureEntitiesLoaded(config: SiteConfig): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<void> => {
    // Load in parallel: the optional pangenome fetch must not add serial
    // latency to (or gate) the entity load, which every data page depends on.
    await Promise.all([
      loadWorkflows(),
      loadPangenomes(),
      loadEntities(config),
    ]);
  })();

  return loadPromise;
}
