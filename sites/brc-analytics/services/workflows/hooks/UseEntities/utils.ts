import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type EntityLoads } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import {
  createEntitiesLoader,
  loadEntities,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { UNCATALOGED_WORKFLOWS } from "@repo/shared/workflow/listedWorkflows";

/**
 * Starts loading the entities and workflows.
 * @param config - Site config.
 * @returns Load promise per entity list, workflows included.
 */
export const ensureEntitiesLoaded = createEntitiesLoader(
  (config: SiteConfig): EntityLoads => ({
    ...loadEntities(config),
    workflows: loadWorkflows([CUSTOM_WORKFLOW, ...UNCATALOGED_WORKFLOWS]),
  })
);
