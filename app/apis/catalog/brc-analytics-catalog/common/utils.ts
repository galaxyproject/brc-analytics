import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { formatTrsId } from "@repo/shared/workflow/utils";
import { type WorkflowEntity } from "@site-config/brc-analytics/local/index/workflow/types";
import {
  type BRCDataCatalogGenome,
  type BRCDataCatalogOrganism,
} from "./entities";

export function getGenomeId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(genome?: BRCDataCatalogGenome): string {
  if (!genome) return "";
  return `${genome.taxonomicLevelSpecies}`;
}

export function getOrganismId(organism: BRCDataCatalogOrganism): string {
  return sanitizeEntityId(organism.ncbiTaxonomyId);
}

/**
 * Get the ID of the organism entity associated with the given genome.
 * @param genome - Genome.
 * @returns organism ID.
 */
export function getGenomeOrganismId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.speciesTaxonomyId);
}

/**
 * Get the ID of the workflow entity.
 * @param workflow - Workflow.
 * @returns workflow ID.
 */
export function getWorkflowId(workflow: WorkflowEntity): string {
  return formatTrsId(workflow.trsId);
}
