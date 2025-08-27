import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../apis/catalog/ga2/entities";
import { ComponentProps } from "react";
import * as C from "../../../components";
import { ROUTES } from "../../../../routes/constants";
import { sanitizeEntityId } from "../../../apis/catalog/common/utils";

/**
 * Build props for the species cell.
 * @param entity - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismSpecies = (
  entity: GA2OrganismEntity
): ComponentProps<typeof C.Link> => {
  return {
    label: entity.species,
    url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.ncbiTaxonomyId)}`,
  };
};

/**
 * Build props for the species cell.
 * @param entity - Entity with a species property.
 * @returns Props for the Link component.
 */
export const buildSpecies = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof C.Link> => {
  return {
    label: entity.species,
    url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.speciesTaxonomyId)}`,
  };
};

/**
 * Build props for the strain cell.
 * @param entity - Entity.
 * @returns Props for the BasicCell component.
 */
export const buildStrain = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: entity.strain,
  };
};
