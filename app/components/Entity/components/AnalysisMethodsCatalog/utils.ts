import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  Workflow,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

type ORGANISM_PLOIDY =
  import("../../../../apis/catalog/brc-analytics-catalog/common/entities").BRCDataCatalogGenome["ploidy"][0];

/**
 * Formats a trsId for use in URLs by removing the hash character if it begins with one
 * and replacing any special characters with hyphens.
 * @param trsId - The trsId to format.
 * @returns The formatted trsId.
 */
export function formatTrsId(trsId: string): string {
  return trsId.replace(/^#/, "").replace(/[^a-zA-Z0-9]/g, "-");
}

/**
 * Determines if a workflow is compatible with a given assembly.
 * @param workflow - The workflow to check compatibility for.
 * @param assembly - The assembly to check compatibility against.
 * @returns True if the workflow is compatible with the assembly, false otherwise.
 */
export function workflowIsCompatibleWithAssembly(
  workflow: Workflow,
  assembly: BRCDataCatalogGenome
): boolean {
  return workflowIsCompatibleWithEntity(workflow, assembly);
}

/**
 * Determines if a workflow is compatible with a given organism.
 * @param workflow - The workflow to check compatibility for.
 * @param organism - The organism to check compatibility against.
 * @returns True if the workflow is compatible with the organism, false otherwise.
 */
export function workflowIsCompatibleWithOrganism(
  workflow: Workflow,
  organism: BRCDataCatalogOrganism
): boolean {
  return workflowIsCompatibleWithEntity(workflow, organism);
}

/**
 * Generic function to determine if a workflow is compatible with an entity (assembly or organism).
 * @param workflow - The workflow to check compatibility for.
 * @param entity - The entity to check compatibility against.
 * @returns True if the workflow is compatible with the entity, false otherwise.
 */
export function workflowIsCompatibleWithEntity(
  workflow: Workflow,
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): boolean {
  // Check taxonomy compatibility
  if (workflow.taxonomyId !== null) {
    const entityTaxonomyIds = getEntityTaxonomyIds(entity);
    if (!entityTaxonomyIds.includes(workflow.taxonomyId)) {
      return false;
    }
  }

  // Check ploidy compatibility
  const entityPloidies = getEntityPloidies(entity);
  return entityPloidies.some((entityPloidy) =>
    workflowPloidyMatchesOrganismPloidy(workflow.ploidy, entityPloidy)
  );
}

/**
 * Gets taxonomy IDs for an entity (assembly or organism).
 * @param entity - The entity to get taxonomy IDs for.
 * @returns Array of taxonomy IDs.
 */
function getEntityTaxonomyIds(
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): string[] {
  if ("lineageTaxonomyIds" in entity) {
    // Assembly/Genome entity
    return entity.lineageTaxonomyIds;
  } else {
    // Organism entity - use taxonomy IDs from its genomes
    const taxonomyIds = new Set<string>();
    taxonomyIds.add(entity.ncbiTaxonomyId);
    entity.genomes.forEach((genome) => {
      genome.lineageTaxonomyIds.forEach((id) => taxonomyIds.add(id));
    });
    return Array.from(taxonomyIds);
  }
}

/**
 * Gets ploidy values for an entity (assembly or organism).
 * @param entity - The entity to get ploidy values for.
 * @returns Array of ploidy values.
 */
function getEntityPloidies(
  entity: BRCDataCatalogGenome | BRCDataCatalogOrganism
): ORGANISM_PLOIDY[] {
  if ("ploidy" in entity) {
    // Assembly/Genome entity
    return entity.ploidy;
  } else {
    // Organism entity - collect ploidy values from its genomes
    const ploidies = new Set<ORGANISM_PLOIDY>();
    entity.genomes.forEach((genome) => {
      genome.ploidy.forEach((ploidy) => ploidies.add(ploidy));
    });
    return Array.from(ploidies);
  }
}
