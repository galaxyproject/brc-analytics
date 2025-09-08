import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";
import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  ANALYZE_GENOME,
  ACCESSION,
  TAXONOMIC_LEVEL_SPECIES,
  TAXONOMIC_LEVEL_STRAIN,
  TAXONOMY_ID,
  TAXONOMIC_GROUP,
  IS_REF,
  LEVEL,
  CHROMOSOMES,
  LENGTH,
  SCAFFOLD_COUNT,
  SCAFFOLD_N50,
  SCAFFOLD_L50,
  COVERAGE,
  GC_PERCENT,
  ANNOTATION_STATUS,
} from "./columnDefs";

export const COLUMNS: ColumnConfig<GA2AssemblyEntity>[] = [
  ANALYZE_GENOME,
  ACCESSION,
  TAXONOMIC_LEVEL_SPECIES,
  TAXONOMIC_LEVEL_STRAIN,
  TAXONOMY_ID,
  TAXONOMIC_GROUP,
  IS_REF,
  LEVEL,
  CHROMOSOMES,
  LENGTH,
  SCAFFOLD_COUNT,
  SCAFFOLD_N50,
  SCAFFOLD_L50,
  COVERAGE,
  GC_PERCENT,
  ANNOTATION_STATUS,
];
