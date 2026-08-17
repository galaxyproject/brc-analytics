import { type GA2OrganismEntity } from "@ga2/apis/organism";
import { config } from "@ga2/config/config";
import { FEATURE_FLAGS } from "@ga2/config/featureFlags";
import { loadWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/utils";
import { buildOrganismWorkflows } from "@repo/shared/views/OrganismView/components/Main/utils";
import { type GA2OrganismDetail } from "./types";

/**
 * Attaches the build-computed fields the organism detail page renders — the
 * organism's compatible workflow categories — so the page prerenders fully
 * without the client entity store.
 * @param organism - Organism record.
 * @returns Organism detail data.
 */
export async function augmentOrganismDetail(
  organism: GA2OrganismEntity
): Promise<GA2OrganismDetail> {
  const categories = await loadWorkflowCategories(getWorkflowsStaticLoadFile());
  const workflowCategories = buildOrganismWorkflows(
    organism,
    categories,
    FEATURE_FLAGS.includes("assembly-workflows")
  );
  return { ...organism, workflowCategories };
}

/**
 * Returns the workflows catalog file path from the site's workflows entity
 * config, so build and runtime read the same source.
 * @returns Workflows catalog file path.
 */
function getWorkflowsStaticLoadFile(): string {
  const staticLoadFile = config().entities.find(
    ({ route }) => route === "workflows"
  )?.staticLoadFile;
  if (!staticLoadFile) throw new Error("Workflows staticLoadFile not found");
  return staticLoadFile;
}
