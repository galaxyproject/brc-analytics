import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { buildOrganismWorkflows } from "@repo/shared/views/OrganismView/components/Main/utils";
import { promises as fsp } from "fs";

const categoriesByFile = new Map<string, Promise<WorkflowCategory[]>>();

/**
 * Builds the organism's compatible workflow categories at build time. The
 * feature-flagged assembly category is included — flags are per-user runtime
 * state, so the prerendered data carries the superset and the rendering
 * component applies the flag gate.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param organism - Organism record.
 * @returns Organism-compatible workflow categories.
 */
export async function loadOrganismWorkflowCategories(
  config: () => Pick<SiteConfig, "entities">,
  organism: OrganismContract
): Promise<WorkflowCategory[]> {
  const categories = await loadWorkflowCategories(
    getWorkflowsStaticLoadFile(config)
  );
  return buildOrganismWorkflows(organism, categories, true);
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
