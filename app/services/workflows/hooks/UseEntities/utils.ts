import {
  loadEntities,
  loadPangenomes,
  loadWorkflows,
} from "@/services/workflows/loader";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";

let loadPromise: Promise<void> | null = null;

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export function ensureEntitiesLoaded(config: SiteConfig): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<void> => {
    // Load in parallel so the optional pangenome fetch adds no serial latency
    // to the core workflows/entities load that every data page depends on.
    await Promise.all([
      loadWorkflows(),
      loadPangenomes(),
      loadEntities(config),
    ]);
  })();

  return loadPromise;
}
