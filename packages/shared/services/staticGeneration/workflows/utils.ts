import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import type { WithWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/types";
import { buildOrganismWorkflows } from "@repo/shared/workflow/organismWorkflows";
import { promises as fsp } from "fs";

const categoriesByFile = new Map<string, Promise<WorkflowCategory[]>>();

/**
 * Builds the organism's compatible workflow categories at build time. No
 * feature-flag gating is applied: flags are per-user runtime state, so the
 * prerendered data carries the flag-inclusive superset and the rendering
 * component applies the user's flags.
 * @param staticLoadFile - Repo-root-relative path to the workflows catalog file.
 * @param organism - Organism record.
 * @returns Organism-compatible workflow categories.
 */
export async function loadOrganismWorkflowCategories(
  staticLoadFile: string,
  organism: OrganismContract
): Promise<WorkflowCategory[]> {
  const categories = await loadWorkflowCategories(staticLoadFile);
  return buildOrganismWorkflows(organism, categories);
}

/**
 * Reads the workflow categories from the given catalog file — the same source
 * the runtime workflows store fetches — memoized per build worker so per-page
 * static props don't re-read the file for every generated page.
 * @param staticLoadFile - Repo-root-relative path to the workflows catalog file.
 * @returns Workflow categories.
 */
export function loadWorkflowCategories(
  staticLoadFile: string
): Promise<WorkflowCategory[]> {
  let promise = categoriesByFile.get(staticLoadFile);
  if (!promise) {
    promise = fsp.readFile(staticLoadFile, "utf8").then((text) => {
      const categories = JSON.parse(text) as WorkflowCategory[];
      if (!Array.isArray(categories))
        throw new Error(`Workflows catalog is not an array: ${staticLoadFile}`);
      return categories;
    });
    // Don't cache a failed read — evict on rejection so a transient error
    // doesn't poison every subsequent page render in the same worker.
    promise.catch(() => categoriesByFile.delete(staticLoadFile));
    categoriesByFile.set(staticLoadFile, promise);
  }
  return promise;
}

/**
 * Binds a site's config to a build-time augmenter that attaches an organism's
 * compatible workflow categories to its record — the build-computed half of
 * organism detail data that every site shares.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns Build-time augmenter for the site's organism records.
 */
export function makeWorkflowCategoriesAugmenter<T extends OrganismContract>(
  config: () => Pick<SiteConfig, "entities">
): (organism: T) => Promise<WithWorkflowCategories<T>> {
  // Resolved on first use rather than here, so binding the augmenter doesn't
  // read the config at import time; kept afterwards, because the entity configs
  // don't change during a build and the lookup scans the array once per page
  // otherwise -- roughly once per generated organism.
  let staticLoadFile: string | undefined;
  return async (organism) => {
    staticLoadFile ??= getWorkflowsStaticLoadFile(config);
    return {
      ...organism,
      workflowCategories: await loadOrganismWorkflowCategories(
        staticLoadFile,
        organism
      ),
    };
  };
}

/**
 * Returns the workflows catalog file path from the site's workflows entity
 * config, so build and runtime read the same source.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns Workflows catalog file path.
 */
function getWorkflowsStaticLoadFile(
  config: () => Pick<SiteConfig, "entities">
): string {
  const staticLoadFile = config().entities.find(
    ({ route }) => route === "workflows"
  )?.staticLoadFile;
  if (!staticLoadFile) throw new Error("Workflows staticLoadFile not found");
  return staticLoadFile;
}
