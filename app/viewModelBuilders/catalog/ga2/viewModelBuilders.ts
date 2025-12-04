import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../../apis/catalog/ga2/entities";
import { ComponentProps } from "react";
import * as C from "../../../components";
import { ROUTES } from "../../../../routes/constants";
import { sanitizeEntityId } from "../../../apis/catalog/common/utils";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import {
  GA2_CATEGORY_KEY,
  GA2_CATEGORY_LABEL,
} from "../../../../site-config/ga2/category";
import { ColumnDef, getSortedRowModel } from "@tanstack/react-table";
import {
  buildAnalyzeGenome,
  buildGenomeTaxonomicLevelStrain,
  buildIsRef,
  formatNumber,
} from "../brc-analytics-catalog/common/viewModelBuilders";

/**
 * Build props for the assembly BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildAssemblyHero = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof C.BackPageHero> => {
  return {
    breadcrumbs: [
      { path: ROUTES.GENOMES, text: "Assemblies" },
      { path: "", text: entity.accession },
      { path: "", text: "Select a Workflow" },
    ],
    title: "Select a Workflow",
  };
};

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
      { path: "", text: "Assemblies" },
    ],
    title: entity.taxonomicLevelSpecies,
  };
};

/**
 * Build props for the organism BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismImage = (
  entity: GA2OrganismEntity | GA2AssemblyEntity
): ComponentProps<typeof C.OrganismAvatar> => {
  return {
    image: entity.image,
    isThumbnail: false,
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
): ComponentProps<typeof C.DetailViewTable<GA2AssemblyEntity>> {
  return {
    Paper: C.FluidPaper as typeof FluidPaper,
    columns: buildOrganismGenomesTableColumns(),
    gridTemplateColumns: "auto repeat(13, minmax(152px, 1fr))",
    items: entity.genomes,
    noResultsTitle: "No Assemblies",
    tableOptions: {
      enableRowPosition: false,
      enableSorting: true,
      getSortedRowModel: getSortedRowModel(),
      initialState: {
        columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
        sorting: [
          { desc: true, id: GA2_CATEGORY_KEY.IS_REF },
          { desc: false, id: GA2_CATEGORY_KEY.ACCESSION },
        ],
      },
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
      header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.ACCESSION,
      header: GA2_CATEGORY_LABEL.ACCESSION,
      meta: { columnPinned: true },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
      cell: ({ row }) =>
        C.BasicCell(buildGenomeTaxonomicLevelStrain(row.original)),
      header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.TAXONOMY_ID,
      header: GA2_CATEGORY_LABEL.TAXONOMY_ID,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => C.ChipCell(buildIsRef(row.original)),
      header: GA2_CATEGORY_LABEL.IS_REF,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LEVEL,
      header: GA2_CATEGORY_LABEL.LEVEL,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.CHROMOSOMES,
      header: GA2_CATEGORY_LABEL.CHROMOSOMES,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LENGTH,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.LENGTH,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.COVERAGE,
      header: GA2_CATEGORY_LABEL.COVERAGE,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.GC_PERCENT,
      header: GA2_CATEGORY_LABEL.GC_PERCENT,
    },
    {
      accessorKey: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
      header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
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
