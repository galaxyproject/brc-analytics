import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { config } from "@brc/config/config";
import { augmentWithWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/utils";
import { loadPangenomes } from "./pangenomes";
import { type BRCOrganismDetail } from "./types";

/**
 * Attaches the build-computed fields the organism detail page renders — the
 * organism's compatible workflow categories and (when present) its species
 * pangenome — so the page prerenders fully without the client entity store.
 * @param organism - Organism record.
 * @returns Organism detail data.
 */
export async function augmentOrganismDetail(
  organism: BRCDataCatalogOrganism
): Promise<BRCOrganismDetail> {
  // Read together: the two catalogs are independent, and this runs once per
  // organism page, so serializing them would add the pangenome read's latency
  // to every worker's first page for nothing.
  const [withWorkflowCategories, pangenomes] = await Promise.all([
    augmentWithWorkflowCategories(config, organism),
    loadPangenomes(),
  ]);
  const pangenome = pangenomes.get(organism.ncbiTaxonomyId);
  // Spread the pangenome conditionally: getStaticProps output must be
  // JSON-serializable, and an explicit `undefined` field is not.
  return {
    ...withWorkflowCategories,
    ...(pangenome ? { pangenome } : {}),
  };
}
