import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  loadEntities,
  loadWorkflows,
} from "@repo/shared/services/workflows/loader";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";

let loadPromise: Promise<void> | null = null;

/**
 * Ensures that the entities and workflows are loaded.
 * @param config - Site config.
 * @returns Promise that resolves when the entities and workflows are loaded.
 */
export function ensureEntitiesLoaded(config: SiteConfig): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<void> => {
    await Promise.all([
      loadWorkflows([
        CUSTOM_WORKFLOW,
        DIFFERENTIAL_EXPRESSION_ANALYSIS,
        LOGAN_SEARCH,
        LEXICMAP,
      ]),
      loadEntities(config),
    ]);
  })();

  return loadPromise;
}
