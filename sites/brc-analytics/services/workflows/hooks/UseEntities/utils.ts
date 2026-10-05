import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  createEntitiesLoader,
  loadEntities,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export const ensureEntitiesLoaded = createEntitiesLoader(
  async (config: SiteConfig): Promise<void> => {
    await Promise.all([
      loadWorkflows([
        CUSTOM_WORKFLOW,
        DIFFERENTIAL_EXPRESSION_ANALYSIS,
        ...LMLS_WORKFLOWS,
      ]),
      loadEntities(config),
    ]);
  }
);
