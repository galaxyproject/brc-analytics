import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { ColumnDef, RowData } from "@tanstack/react-table";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../routes/constants";
import {
  GA2_CATEGORY_KEY,
  GA2_CATEGORY_LABEL,
} from "../../../../site-config/ga2/category";
import { sanitizeEntityId } from "../../../apis/catalog/common/utils";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../apis/catalog/ga2/entities";
import * as C from "../../../components";
import {
  buildAnalyzeGenome,
  buildGenomeTaxonomicLevelStrain,
  buildIsRef,
  formatNumber,
  getGenomeStrainText,
} from "../brc-analytics-catalog/common/viewModelBuilders";

/**
 * Build props for the organism BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismHero = (
  entity: GA2OrganismEntity
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: [
      { path: ROUTES.ORGANISMS, text: "Organisms" },
      { path: "", text: entity.taxonomicLevelSpecies },
    ],
    title: entity.taxonomicLevelSpecies,
  };
};

/**
 * Build props for the organism detail main content.
 * @param entity - GA2 organism entity.
 * @returns Props for the OrganismViewMain component.
 */
export const buildOrganismViewMain = (
  entity: GA2OrganismEntity
): ComponentProps<typeof C.OrganismViewMain> => {
  return {
    entityId: sanitizeEntityId(entity.ncbiTaxonomyId),
    organism: entity,
    tableOptions: buildOrganismGenomesTable(entity),
  };
};

/**
 * Build props for the organism BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismImageThumbnail = (
  entity: GA2OrganismEntity | GA2AssemblyEntity
): ComponentProps<typeof C.OrganismAvatar> => {
  return {
    image: entity.image,
    isThumbnail: true,
  };
};

/**
 * Build props for the genomes table for the given organism.
 * @param entity - Entity.
 * @returns props to be used for the table.
 */
export function buildOrganismGenomesTable(
  entity: GA2OrganismEntity
): ComponentProps<typeof C.OrganismViewMain>["tableOptions"] {
  return {
    // Cast: ColumnDef<T> is invariant in T, so the catalog-specific row type
    // cannot widen to RowData even though GA2AssemblyEntity extends it.
    columns: buildOrganismGenomesTableColumns() as ColumnDef<RowData>[],
    data: entity.genomes,
    initialState: {
      columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
      sorting: [
        { desc: true, id: GA2_CATEGORY_KEY.IS_REF },
        { desc: false, id: GA2_CATEGORY_KEY.ACCESSION },
      ],
    },
  };
}

/**
 * Build the column definitions for the organism genomes table.
 * @returns column definitions.
 */
function buildOrganismGenomesTableColumns(): ColumnDef<GA2AssemblyEntity>[] {
  return [
    {
      accessorKey: GA2_CATEGORY_KEY.ANALYZE_GENOME,
      cell: ({ row }) => C.AnalyzeGenome(buildAnalyzeGenome(row.original)),
      enableSorting: false,
      header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
      meta: { width: "auto" },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.ACCESSION,
      header: GA2_CATEGORY_LABEL.ACCESSION,
      meta: { columnPinned: true, width: { max: "1fr", min: "152px" } },
    },
    {
      accessorFn: (row) => getGenomeStrainText(row),
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelStrain(row.original)),
      header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
      id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.TAXONOMY_ID,
      header: GA2_CATEGORY_LABEL.TAXONOMY_ID,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => C.ChipCell(buildIsRef(row.original)),
      header: GA2_CATEGORY_LABEL.IS_REF,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LEVEL,
      header: GA2_CATEGORY_LABEL.LEVEL,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.CHROMOSOMES,
      header: GA2_CATEGORY_LABEL.CHROMOSOMES,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LENGTH,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.LENGTH,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.COVERAGE,
      header: GA2_CATEGORY_LABEL.COVERAGE,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.GC_PERCENT,
      header: GA2_CATEGORY_LABEL.GC_PERCENT,
      meta: { width: { max: "1fr", min: "152px" } },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
      header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
      meta: { width: { max: "1fr", min: "152px" } },
    },
  ];
}

/**
 * Build props for the species cell.
 * @param entity - Organism entity.
 * @returns Props to be used for the cell.
 */
export const buildOrganismSpecies = (
  entity: GA2OrganismEntity
): ComponentProps<typeof C.Link> => {
  return {
    label: entity.taxonomicLevelSpecies,
    url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.ncbiTaxonomyId)}`,
  };
};

/**
 * Build props for the species cell.
 * @param entity - Entity with a species property.
 * @returns Props for the Link component.
 */
export const buildTaxonomicLevelSpecies = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof C.Link> => {
  return {
    label: entity.taxonomicLevelSpecies,
    url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.speciesTaxonomyId)}`,
  };
};
