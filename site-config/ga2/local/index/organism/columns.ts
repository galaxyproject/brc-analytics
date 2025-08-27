import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { GA2OrganismEntity } from "../../../../../app/apis/catalog/ga2/entities";
import {
  ASSEMBLY_COUNT,
  ASSEMBLY_TAXONOMY_IDS,
  SPECIES,
  TAXONOMIC_GROUP,
} from "./columnDefs";

export const COLUMNS: ColumnConfig<GA2OrganismEntity>[] = [
  SPECIES,
  ASSEMBLY_TAXONOMY_IDS,
  TAXONOMIC_GROUP,
  ASSEMBLY_COUNT,
];
