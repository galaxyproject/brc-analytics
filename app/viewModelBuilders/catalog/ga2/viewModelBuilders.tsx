import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "@/apis/catalog/ga2/entities";
import { OrganismAvatar } from "@/components/Entity/components/OrganismAvatar/organismAvatar";
import {
  COLUMN_PRESET_KEY,
  COLUMN_PRESET_LABEL,
} from "@/views/OrganismView/components/Main/constants";
import { Main as OrganismViewMain } from "@/views/OrganismView/components/Main/main";
import { sanitizeEntityId } from "@brc-analytics/core/apis/utils";
import { AnalyzeGenome } from "@brc-analytics/core/components/common/Table/components/TableCell/components/AnalyzeGenome/analyzeGenome";
import { LevelCell } from "@brc-analytics/core/components/common/Table/components/TableCell/components/LevelCell/levelCell";
import { TagList } from "@brc-analytics/core/components/common/Table/components/TableCell/components/SpeciesCell/components/TagList/tagList";
import { SpeciesCell } from "@brc-analytics/core/components/common/Table/components/TableCell/components/SpeciesCell/speciesCell";
import type { SpeciesTag } from "@brc-analytics/core/components/common/Table/components/TableCell/components/SpeciesCell/types";
import { Tooltip } from "@brc-analytics/core/components/common/Tooltip/tooltip";
import { ROUTES } from "@brc-analytics/core/routes/constants";
import { ORGANISM_SCOPED_TAG_LABELS } from "@brc-analytics/core/viewModelBuilders/constants";
import {
  buildAnalyzeGenome,
  buildGroupTag,
  buildIsRef,
  buildLevel,
  buildReleaseDate,
  buildReleaseDateTooltip,
  formatNumber,
  getGenomeStrainText,
} from "@brc-analytics/core/viewModelBuilders/viewModelBuilders";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import {
  GA2_CATEGORY_KEY,
  GA2_CATEGORY_LABEL,
} from "@site-config/ga2/category";
import { ColumnDef, RowData, VisibilityState } from "@tanstack/react-table";
import { ComponentProps } from "react";

/**
 * Build props for the organism BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismHero = (
  entity: GA2OrganismEntity
): ComponentProps<typeof BackPageHero> => {
  // The species/group are constant across the organism's assemblies, so surface
  // the group as a header chip rather than repeating it on every assembly row.
  const groupTag = buildGroupTag(entity.taxonomicGroup);
  return {
    breadcrumbs: [
      { path: ROUTES.ORGANISMS, text: "Organisms" },
      { path: "", text: entity.taxonomicLevelSpecies },
    ],
    subTitle: groupTag ? <TagList tags={[groupTag]} /> : undefined,
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
): ComponentProps<typeof OrganismViewMain> => {
  return {
    assembly: {
      columnPresets: ORGANISM_GENOMES_COLUMN_PRESETS,
      tableOptions: buildOrganismGenomesTable(entity),
    },
    entityId: sanitizeEntityId(entity.ncbiTaxonomyId),
    organism: entity,
  };
};

/**
 * Complete visibility state for the Default preset, also used as the table's
 * initial state. Columns not listed here are shown; the internal row-position
 * column is always hidden.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  [COLUMN_IDENTIFIER.ROW_POSITION]: false,
  [GA2_CATEGORY_KEY.CHROMOSOMES]: false,
  [GA2_CATEGORY_KEY.COVERAGE]: false,
  [GA2_CATEGORY_KEY.GC_PERCENT]: false,
  [GA2_CATEGORY_KEY.SCAFFOLD_COUNT]: false,
  [GA2_CATEGORY_KEY.SCAFFOLD_L50]: false,
  [GA2_CATEGORY_KEY.SCAFFOLD_N50]: false,
};

/**
 * The column presets (Default, Quality) for the organism genomes table. Each
 * preset's complete visibility state is applied via table.setColumnVisibility
 * on toggle; columns not listed are shown.
 */
const ORGANISM_GENOMES_COLUMN_PRESETS: ComponentProps<
  typeof OrganismViewMain
>["assembly"]["columnPresets"] = [
  {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    key: COLUMN_PRESET_KEY.DEFAULT,
    label: COLUMN_PRESET_LABEL.DEFAULT,
  },
  {
    columnVisibility: {
      [COLUMN_IDENTIFIER.ROW_POSITION]: false,
      [GA2_CATEGORY_KEY.ANNOTATION_STATUS]: false,
      [GA2_CATEGORY_KEY.IS_REF]: false,
      [GA2_CATEGORY_KEY.LENGTH]: false,
      [GA2_CATEGORY_KEY.RELEASE_DATE]: false,
    },
    key: COLUMN_PRESET_KEY.QUALITY,
    label: COLUMN_PRESET_LABEL.QUALITY,
  },
];

/**
 * Build props for the organism BackPageHero component.
 * @param entity - Entity.
 * @returns Props to be used for the BackPageHero component.
 */
export const buildOrganismImageThumbnail = (
  entity: GA2OrganismEntity | GA2AssemblyEntity
): ComponentProps<typeof OrganismAvatar> => {
  return {
    image: entity.image,
    isThumbnail: true,
  };
};

/**
 * Build table options (columns, data, initial state) for the genomes table for the given organism.
 * @param entity - Organism entity with genomes to be displayed in the table.
 * @returns table options.
 */
export function buildOrganismGenomesTable(
  entity: GA2OrganismEntity
): ComponentProps<typeof OrganismViewMain>["assembly"]["tableOptions"] {
  return {
    // Cast: ColumnDef<T> is invariant in T, so the catalog-specific row type
    // cannot widen to RowData even though GA2AssemblyEntity extends it.
    columns: buildOrganismGenomesTableColumns() as ColumnDef<RowData>[],
    data: entity.genomes,
    initialState: {
      // Mount on the Default preset so the table matches the toggle.
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sorting: [
        { desc: true, id: GA2_CATEGORY_KEY.IS_REF },
        { desc: false, id: GA2_CATEGORY_KEY.ACCESSION },
      ],
    },
  };
}

/**
 * Header for the pinned species column on the organism detail table: relabelled
 * "Assembly" since the cell's primary text is the assembly accession.
 */
const ASSEMBLY_COLUMN_HEADER = "Assembly";

/**
 * Build the column definitions for the organism genomes table.
 * @returns column definitions.
 */
function buildOrganismGenomesTableColumns(): ColumnDef<GA2AssemblyEntity>[] {
  return [
    {
      accessorKey: GA2_CATEGORY_KEY.ANALYZE_GENOME,
      cell: ({ row }) => (
        <AnalyzeGenome {...buildAnalyzeGenome(row.original)} />
      ),
      enableSorting: false,
      header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
      meta: { header: GA2_CATEGORY_LABEL.ANALYZE_GENOME, width: "auto" },
    },
    {
      // Keyed on accession so the pinned "Assembly" column sorts by accession
      // (its primary text); the SpeciesCell renders the accession + per-assembly
      // tags.
      accessorKey: GA2_CATEGORY_KEY.ACCESSION,
      cell: ({ row }) => (
        <SpeciesCell {...buildOrganismAssemblySpecies(row.original)} />
      ),
      header: ASSEMBLY_COLUMN_HEADER,
      meta: {
        columnPinned: true,
        header: ASSEMBLY_COLUMN_HEADER,
        width: { max: "0.75fr", min: "176px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.RELEASE_DATE,
      cell: ({ row }) => (
        <Tooltip {...buildReleaseDateTooltip(row.original)}>
          <BasicCell {...buildReleaseDate(row.original)} />
        </Tooltip>
      ),
      header: GA2_CATEGORY_LABEL.RELEASE_DATE,
      meta: {
        header: GA2_CATEGORY_LABEL.RELEASE_DATE,
        width: { max: "1fr", min: "140px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.IS_REF,
      cell: ({ row }) => <ChipCell {...buildIsRef(row.original)} />,
      header: GA2_CATEGORY_LABEL.IS_REF,
      meta: {
        header: GA2_CATEGORY_LABEL.IS_REF,
        width: { max: "1fr", min: "100px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LEVEL,
      cell: ({ row }) => <LevelCell {...buildLevel(row.original)} />,
      header: GA2_CATEGORY_LABEL.LEVEL,
      meta: {
        header: GA2_CATEGORY_LABEL.LEVEL,
        width: { max: "1fr", min: "152px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.CHROMOSOMES,
      header: GA2_CATEGORY_LABEL.CHROMOSOMES,
      meta: {
        header: GA2_CATEGORY_LABEL.CHROMOSOMES,
        width: { max: "1fr", min: "142px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.LENGTH,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.LENGTH,
      meta: {
        header: GA2_CATEGORY_LABEL.LENGTH,
        width: { max: "1fr", min: "152px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
      meta: {
        header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
        width: { max: "1fr", min: "116px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_N50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
      meta: {
        header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
        width: { max: "1fr", min: "120px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.SCAFFOLD_L50,
      cell: ({ getValue }) => formatNumber(getValue()),
      header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
      meta: {
        header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
        width: { max: "1fr", min: "116px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.COVERAGE,
      header: GA2_CATEGORY_LABEL.COVERAGE,
      meta: {
        header: GA2_CATEGORY_LABEL.COVERAGE,
        width: { max: "1fr", min: "116px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.GC_PERCENT,
      header: GA2_CATEGORY_LABEL.GC_PERCENT,
      meta: {
        header: GA2_CATEGORY_LABEL.GC_PERCENT,
        width: { max: "1fr", min: "116px" },
      },
    },
    {
      accessorKey: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
      header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
      meta: {
        header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
        width: { max: "1fr", min: "140px" },
      },
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
): ComponentProps<typeof Link> => {
  return {
    label: entity.taxonomicLevelSpecies,
    url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.ncbiTaxonomyId)}`,
  };
};

/**
 * Build props for the consolidated species cell on the assembly list page.
 * Combines the species name and taxonomy id with the populated minor taxonomy
 * fields (strain, taxonomic group), each surfaced as a chip only when present.
 * GA2 assemblies have no serotype, isolate or priority pathogen.
 * @param entity - Assembly entity.
 * @returns Props to be used for the SpeciesCell component.
 */
export const buildAssemblySpecies = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof SpeciesCell> => {
  const tags: SpeciesTag[] = [];
  const strain = getGenomeStrainText(entity);
  if (strain) tags.push({ label: "strain", tooltip: strain, value: strain });
  const groupTag = buildGroupTag(entity.taxonomicGroup);
  if (groupTag) tags.push(groupTag);
  return {
    ncbiTaxonomyId: entity.ncbiTaxonomyId,
    species: {
      label: entity.taxonomicLevelSpecies,
      url: `${ROUTES.ORGANISMS}/${sanitizeEntityId(entity.speciesTaxonomyId)}`,
    },
    tags,
  };
};

/**
 * Build props for the species cell on the organism detail page assembly table.
 * The accession is the cell's primary (unlinked) label — the species name is
 * redundant on a single-organism page and moves to the hero title. The
 * organism-scoped group tag is dropped here as it moves to the hero; only
 * per-assembly tags (strain) remain.
 * @param entity - Assembly entity.
 * @returns Props to be used for the SpeciesCell component.
 */
export const buildOrganismAssemblySpecies = (
  entity: GA2AssemblyEntity
): ComponentProps<typeof SpeciesCell> => {
  const props = buildAssemblySpecies(entity);
  return {
    ...props,
    // Accession replaces the species name as the cell's primary text (rendered
    // as plain text — no link). Organism-scoped tags move to the page header.
    species: { label: entity.accession, url: "" },
    tags: props.tags?.filter(
      ({ label }) => !ORGANISM_SCOPED_TAG_LABELS.includes(label)
    ),
  };
};
