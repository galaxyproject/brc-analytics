import { type GA2OrganismEntity } from "@ga2/apis/organism";
import { config } from "@ga2/config/config";
import { loadOrganismWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/utils";
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
  const workflowCategories = await loadOrganismWorkflowCategories(
    config,
    organism
  );
  return { ...organism, workflowCategories };
}
