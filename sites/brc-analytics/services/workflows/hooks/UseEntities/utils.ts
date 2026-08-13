import { loadPangenomes } from "@brc/services/workflows/loader";
import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  createEntitiesLoader,
  loadEntities,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export const ensureEntitiesLoaded = createEntitiesLoader(
  async (config: SiteConfig): Promise<void> => {
    // Load in parallel so the optional pangenome fetch adds no serial latency
    // to the core workflows/entities load that every data page depends on.
    await Promise.all([
      loadWorkflows([
        CUSTOM_WORKFLOW,
        DIFFERENTIAL_EXPRESSION_ANALYSIS,
        LOGAN_SEARCH,
        LEXICMAP,
      ]),
      loadPangenomes(),
      loadEntities(config),
    ]);
  }
);
