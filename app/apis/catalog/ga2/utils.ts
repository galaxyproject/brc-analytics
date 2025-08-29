import { sanitizeEntityId } from "../common/utils";
import { GA2AssemblyEntity, GA2OrganismEntity } from "./entities";

/**
 * Get the ID of the given assembly entity.
 * @param entity - Entity.
 * @returns entity ID.
 */
export function getAssemblyId(entity?: GA2AssemblyEntity): string {
  return sanitizeEntityId(entity?.accession);
}

/**
 * Get the title of the given assembly entity.
 * @param entity - Entity.
 * @returns entity title.
 */
export function getAssemblyTitle(entity?: GA2AssemblyEntity): string {
  return entity?.taxonomicLevelSpecies || "";
}

/**
 * Get the ID of the given organism entity.
 * @param entity - Entity.
 * @returns entity ID.
 */
export function getOrganismId(entity?: GA2OrganismEntity): string {
  return entity?.ncbiTaxonomyId || "";
}
