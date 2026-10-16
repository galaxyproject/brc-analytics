import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  createEntitiesLoader,
  loadEntities,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { UNCATALOGED_WORKFLOWS } from "@repo/shared/workflow/listedWorkflows";

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export const ensureEntitiesLoaded = createEntitiesLoader(
  async (config: SiteConfig): Promise<void> => {
    await Promise.all([
      loadWorkflows([CUSTOM_WORKFLOW, ...UNCATALOGED_WORKFLOWS]),
      loadEntities(config),
    ]);
  }
);
